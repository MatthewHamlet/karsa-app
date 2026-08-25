import CareShell, { type CareTab } from "../components/CareShell";
import { CONTEXT_LABEL, type CareContextType } from "../data/care";
import type { CareData } from "../lib/care/view";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function CarePage({
  params,
  data,
}: {
  params: Record<string, string | string[] | undefined>;
  data?: CareData;
}) {
  const ref = first(params.ref);
  const label = first(params.label);
  const detail = first(params.detail);

  const [rawType] = ref?.split(":") ?? [];
  const type = (rawType ?? "") as CareContextType;
  const context = CONTEXT_LABEL[type] && label ? { type, label, detail } : null;

  const tab: CareTab = context || first(params.tab) === "obrolan" ? "chat" : "stats";

  return (
    <div className="w-full px-4 pb-10 pt-6 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pb-12 xl:pt-12">
      <CareShell initialTab={tab} context={context} data={data} />
    </div>
  );
}
