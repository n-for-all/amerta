"use client";
import type { FormFieldBlock, Form as FormType } from "@payloadcms/plugin-form-builder/types";

import { useRouter } from "next/navigation";
import React, { useCallback, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";

import { Button } from "@/amerta/theme/ui/button";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

import { fields } from "./fields";
import { getServerSideURL } from "@/amerta/utilities/getURL";
import RichText from "@/amerta/theme/components/RichText";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

export type FormBlockType = {
  blockName?: string;
  blockType?: "formBlock";
  enableIntro: boolean;
  form: FormType;
  introContent?: SerializedEditorState;
  renderSubmitButton?: (formId, label, { isLoading, hasSubmitted }) => React.ReactNode;
};

export const FormBlock: React.FC<
  {
    id?: string;
    action?: string;
    className?: string;
  } & FormBlockType
> = (props) => {
  const { enableIntro, className, action, form: formFromProps, form: { id: formID, confirmationMessage, confirmationType, redirect, submitButtonLabel } = {}, introContent, renderSubmitButton } = props;

  const formMethods = useForm({
    defaultValues: formFromProps.fields as any,
  });
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods;

  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>();
  const [error, setError] = useState<{ message: string; status?: string } | undefined>();
  const router = useRouter();
  const { locale } = useEcommerce();

  const onSubmit = useCallback(
    (data: FormFieldBlock[]) => {
      let loadingTimerID: ReturnType<typeof setTimeout>;
      const submitForm = async () => {
        setError(undefined);

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }));

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true);
        }, 1000);

        try {
          const req = await fetch(action ? action : `${getServerSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          });

          const res = await req.json();

          clearTimeout(loadingTimerID);

          if (req.status >= 400) {
            setIsLoading(false);

            setError({
              message: res.errors?.[0]?.message || "Internal Server Error",
              status: res.status,
            });

            return;
          }

          setIsLoading(false);
          setHasSubmitted(true);

          if (confirmationType === "redirect" && redirect) {
            const { url } = redirect;

            const redirectUrl = url;

            if (redirectUrl) router.push(redirectUrl);
          } else {
            // reset the form if not redirecting
            setTimeout(() => {
              formMethods.reset();
              setHasSubmitted(false);
            }, 15000);
          }
        } catch (err) {
          console.warn(err);
          setIsLoading(false);
          setError({
            message: "Something went wrong with the form block.",
          });
        }
      };

      void submitForm();
    },
    [router, formID, redirect, confirmationType],
  );

  return (
    <div className={`${className} lg:max-w-[48rem]`}>
      {enableIntro && introContent && !hasSubmitted && <RichText locale={locale} className="mb-8 lg:mb-12" data={introContent} enableGutter={false} />}
      <FormProvider {...formMethods}>
        {!isLoading && hasSubmitted && confirmationType === "message" && <div className="px-2 py-1 mb-1 text-sm text-green-800 border border-green-400 rounded bg-green-150 prose-xs">{typeof confirmationMessage == "string" ? confirmationMessage : <RichText className="text-xs prose-sm" data={confirmationMessage} />}</div>}
        {error ? <div className="px-2 py-1 mb-1 text-sm text-red-400 bg-red-100 border border-red-200 rounded">{`${error?.message || ""}`}</div> : null}

        <form id={formID} onSubmit={handleSubmit(onSubmit)} className="relative">
          <div className="mb-6">
            {formFromProps &&
              formFromProps.fields &&
              formFromProps.fields?.map((field: any, index) => {
                if (field.type == "row") {
                  return (
                    <div className={field.className || ""} key={index}>
                      {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                      field.fields?.map((subField: FormFieldBlock, subIndex: number) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const Field: React.FC<any> = fields?.[subField.blockType as keyof typeof fields];
                        if (Field) {
                          return <Field key={subIndex} form={formFromProps} {...subField} {...formMethods} control={control} errors={errors} register={register} />;
                        }
                        return null;
                      })}
                    </div>
                  );
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields];
                if (Field) {
                  return (
                    <div className="mb-4 last:mb-0" key={index}>
                      <Field key={index} form={formFromProps} {...field} {...formMethods} control={control} errors={errors} register={register} />
                    </div>
                  );
                }
                return null;
              })}
          </div>
          {renderSubmitButton ? (
            renderSubmitButton(formID, submitButtonLabel, { isLoading, hasSubmitted })
          ) : (
            <Button form={formID} type="submit" disabled={isLoading || hasSubmitted} variant="default">
              {submitButtonLabel}
            </Button>
          )}
        </form>

        {isLoading && !hasSubmitted ? <p className="mt-1 text-xs">Submitting, please wait...</p> : null}
      </FormProvider>
    </div>
  );
};
