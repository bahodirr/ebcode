"use client";

import { useEffect, useReducer, useRef } from "react";
import type { Event, Message, Part, Session } from "@opencode-ai/sdk";
import { agentApi } from "@/lib/http";

type State = {
  messages: Message[];
  parts: Record<string, Part[]>;
  session?: Session;
  connected: boolean;
};

type StreamEvent = Event | { type: string; properties?: Record<string, any> };

const initialState: State = { messages: [], parts: {}, connected: false };

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex(x => x.id === item.id);
  if (idx === -1) return [...list, item];
  return [...list.slice(0, idx), { ...list[idx], ...item }, ...list.slice(idx + 1)];
}

function reducer(state: State, event: StreamEvent, sessionId?: string): State {
  const props = (event as any).properties;
  if (!props) {
    return event.type === "session.deleted" ? { ...initialState } : state;
  }

  switch (event.type) {
    case "session.updated":
      return props.info?.id === sessionId ? { ...state, session: props.info } : state;
    case "session.deleted":
      return props.sessionID === sessionId ? { ...initialState } : state;
    case "message.updated":
      return props.info?.sessionID === sessionId
        ? { ...state, messages: upsert(state.messages, props.info) }
        : state;
    case "message.removed": {
      const parts = { ...state.parts };
      delete parts[props.messageID];
      return { ...state, messages: state.messages.filter(m => m.id !== props.messageID), parts };
    }
    case "message.part.updated": {
      const part = props.part as Part;
      return { ...state, parts: { ...state.parts, [part.messageID]: upsert(state.parts[part.messageID] || [], part) } };
    }
    case "message.part.removed": {
      const parts = { ...state.parts };
      const filtered = parts[props.messageID]?.filter(p => p.id !== props.partID);
      if (filtered?.length) parts[props.messageID] = filtered;
      else delete parts[props.messageID];
      return { ...state, parts };
    }
    case "server.connected":
      return { ...state, connected: true };
    case "connection.closed":
      return { ...state, connected: false };
    default:
      return state;
  }
}

type Props = { sessionId?: string; projectId?: string; sandboxId?: string };

export default function useAgentStream({ sessionId, projectId, sandboxId }: Props) {
  const [state, dispatch] = useReducer((s: State, e: StreamEvent) => reducer(s, e, sessionId), initialState);
  const esRef = useRef<EventSource | null>(null);
  const closedRef = useRef(false);

  const api = projectId && sandboxId ? agentApi(projectId, sandboxId) : null;

  // Load initial messages
  useEffect(() => {
    if (!api || !sessionId) return;
    const controller = new AbortController();

    fetch(`${api.fullUrl}/session/${sessionId}/message`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then((items: Array<{ info: Message; parts: Part[] }> | null) => {
        items?.forEach(({ info, parts }) => {
          dispatch({ type: "message.updated", properties: { info } });
          parts.forEach(part => dispatch({ type: "message.part.updated", properties: { part } }));
        });
      })
      .catch(() => {});

    return () => controller.abort();
  }, [sessionId, api?.fullUrl]);

  // SSE subscription
  useEffect(() => {
    if (!api) return;
    closedRef.current = false;

    const connect = () => {
      if (closedRef.current) return;
      esRef.current?.close();
      const es = new EventSource(`${api.fullUrl}/event`);
      esRef.current = es;
      es.onmessage = e => { try { dispatch(JSON.parse(e.data)); } catch {} };
      es.onerror = () => {
        dispatch({ type: "connection.closed" });
        es.close();
        if (!closedRef.current) setTimeout(connect, 2000);
      };
    };
    connect();

    return () => {
      closedRef.current = true;
      dispatch({ type: "connection.closed" });
      esRef.current?.close();
    };
  }, [api?.fullUrl]);

  return state;
}
