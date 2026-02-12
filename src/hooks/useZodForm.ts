import { zodResolver } from '@hookform/resolvers/zod'
import { DefaultValues, FieldValues, Resolver, useForm } from 'react-hook-form'
import { z } from 'zod'

// Flexible wrapper for RHF + Zod v4 that keeps strong typing but avoids resolver signature churn.
export const useZodForm = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  defaultValues?: DefaultValues<z.infer<TSchema>>
) => {
  type FormValues = z.infer<TSchema> extends FieldValues
    ? z.infer<TSchema>
    : Record<string, any>

  const resolver = zodResolver(schema as any) as Resolver<FormValues>

  const {
    register,
    formState: { errors },
    handleSubmit,
    watch,
    reset,
  } = useForm<FormValues>({
    resolver,
    defaultValues: defaultValues as DefaultValues<FormValues>,
  })

  return {
    register,
    errors,
    handleSubmit,
    watch,
    reset,
  }
}
