type Props = {
  text: string;
};

export function JobDescriptionBox({ text }: Props) {
  return (
    <div className="mt-4 max-w-3xl rounded-lg border border-slate-200 bg-white p-4">
      <div className="max-h-52 overflow-y-auto whitespace-pre-wrap pr-1 text-slate-700">
        {text}
      </div>
    </div>
  );
}
