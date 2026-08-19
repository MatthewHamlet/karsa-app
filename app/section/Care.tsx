import CareShell, { type CareTab } from "../components/CareShell";
import { CONTEXT_LABEL, type CareContextType } from "../data/care";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function CarePage({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  /* A "Diskusikan" link lands here: it opens the chat tab with the care item
     already attached to the composer. */
  const ref = first(params.ref);
  const label = first(params.label);
  const detail = first(params.detail);

  const [rawType] = ref?.split(":") ?? [];
  const type = (rawType ?? "") as CareContextType;
  const context = CONTEXT_LABEL[type] && label ? { type, label, detail } : null;

  const tab: CareTab = context || first(params.tab) === "obrolan" ? "chat" : "stats";

  return (
    <div className="w-full px-4 pb-20 pt-20 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pt-12">
      {/* No separate colour band: the clay is the hub's own background. */}
      <CareShell initialTab={tab} context={context} />
    </div>
  );
}
