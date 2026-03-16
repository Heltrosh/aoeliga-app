import { Textarea } from "@mantine/core";

type RulesetRawJsonEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RulesetRawJsonEditor({
  value,
  onChange,
}: RulesetRawJsonEditorProps) {
  return (
    <Textarea
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      autosize
      minRows={28}
      styles={{
        input: {
          fontFamily:
            "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
        },
      }}
    />
  );
}