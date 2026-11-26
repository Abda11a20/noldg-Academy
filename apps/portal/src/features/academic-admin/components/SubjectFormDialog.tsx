import { zodResolver } from "@hookform/resolvers/zod";
import { SubjectInputSchema, type AcademicSubject } from "@noldg/api/contracts/admin";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, Dialog, TextField } from "@noldg/ui";

interface SubjectFields {
  name: string;
}
export interface SubjectFormDialogProps {
  open: boolean;
  subject?: AcademicSubject;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

/** Creates or edits a subject through the shared form and dialog primitives.
 * @param props Dialog state, record, pending state, and callbacks.
 */
export function SubjectFormDialog({
  open,
  subject,
  pending,
  onOpenChange,
  onSave,
}: SubjectFormDialogProps) {
  const { t } = useTranslation("admin");
  const form = useForm<SubjectFields>({
    resolver: zodResolver(SubjectInputSchema),
    defaultValues: { name: subject?.name ?? "" },
  });
  const submit = form.handleSubmit((fields) => onSave(fields.name));
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={subject ? t("academic.actions.edit") : t("academic.actions.createSubject")}
      closeLabel={t("common.close")}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            {t("academic.actions.cancel")}
          </Button>
          <Button disabled={pending} form="subject-form" loading={pending} type="submit">
            {t("academic.actions.save")}
          </Button>
        </>
      }
    >
      <form
        id="subject-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField id="subject-name" label={t("academic.fields.name")} {...form.register("name")} />
      </form>
    </Dialog>
  );
}
