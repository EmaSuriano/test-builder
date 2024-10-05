import { z } from "zod";

const nonEmptyString = z.string().min(1);

export const questionSchema = z.object({
  title: nonEmptyString,
  description: nonEmptyString,
  choices: z.array(nonEmptyString).nonempty(),
  correctAnswer: z.array(nonEmptyString).nonempty(),
  meta: z.string().optional(),
});

export type Question = z.infer<typeof questionSchema>;
