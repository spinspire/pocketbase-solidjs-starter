import { Title } from "@solidjs/meta";
import type { RouteProps } from "@solidjs/router";
import { Errored, For, Loading, Show, createMemo } from "solid-js";
import { pb } from "@/lib/pb";
import type { AuditlogResponse, UsersResponse } from "@/lib/pocketbase-types";
import { dataRev } from "@/lib/refresh";

type Log = AuditlogResponse<{ user: UsersResponse }>;

export default function AuditLogDetail(props: RouteProps<"/auditlog/:coll/:id">) {
  const logs = createMemo(() => {
    dataRev();
    return pb.collection("auditlog").getFullList<Log>({
      filter: pb.filter("collection = {:coll} && record = {:id}", {
        coll: props.params.coll,
        id: props.params.id,
      }),
      expand: "user",
      sort: "-created",
      requestKey: `auditlog-${props.params.coll}-${props.params.id}`,
    });
  });

  const keysOf = (log: Log): string[] => Object.keys(log.original ?? {});

  return (
    <Errored fallback={<main><h1>Not found</h1><p>Couldn't load audit log.</p></main>}>
      <Loading fallback={<main aria-busy="true">Loading audit log…</main>}>
        <main>
          <Title>Audit log - PocketBase SolidJS</Title>
          <h1>Audit log</h1>
          <p class="text-light">
            {props.params.coll} · {props.params.id}
          </p>
          <Show when={logs().length > 0} fallback={<p>No records found.</p>}>
            <div class="table">
              <table>
                <thead>
                  <tr><th>When</th><th>Event</th><th>Who</th></tr>
                </thead>
                <tbody>
                  <For each={logs()}>
                    {(log) => (
                      <>
                        <tr>
                          <td>{log.created}</td>
                          <td>{log.event}</td>
                          <td>{log.admin || log.expand?.user?.name || log.user}</td>
                        </tr>
                        <tr>
                          <td colspan="3">
                            <Show when={keysOf(log).length > 0} fallback={<span class="text-light">No field changes.</span>}>
                              <div class="table">
                                <table>
                                  <thead>
                                    <tr><th>Field</th><th>Original</th><th>Changed to</th></tr>
                                  </thead>
                                  <tbody>
                                    <For each={keysOf(log)}>
                                      {(key) => (
                                        <tr>
                                          <td>{key}</td>
                                          <td><pre>{JSON.stringify(log.original?.[key])}</pre></td>
                                          <td><pre>{JSON.stringify(log.data?.[key])}</pre></td>
                                        </tr>
                                      )}
                                    </For>
                                  </tbody>
                                </table>
                              </div>
                            </Show>
                          </td>
                        </tr>
                      </>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </main>
      </Loading>
    </Errored>
  );
}
