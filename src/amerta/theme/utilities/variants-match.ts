import { ProductOption } from "@/payload-types";

export function variantsMatch(variants1?: Array<{ option: string | ProductOption; value: string }>, variants2?: Array<{ option: string | ProductOption; value: string }>): boolean {
  if ((!variants1 || variants1.length === 0) && (!variants2 || variants2.length === 0)) return true;

  if (!variants1 || !variants2) return false;
  if (variants1.length === 0 || variants2.length === 0) return false;

  if (variants1.length !== variants2.length) return false;

  const getOptionId = (option: string | ProductOption): string => {
    return typeof option === "string" ? option : option.id;
  };

  const sorted1 = [...variants1].sort((a, b) => {
    const idA = getOptionId(a.option);
    const idB = getOptionId(b.option);
    return idA.localeCompare(idB);
  });
  const sorted2 = [...variants2].sort((a, b) => {
    const idA = getOptionId(a.option);
    const idB = getOptionId(b.option);
    return idA.localeCompare(idB);
  });

  return sorted1.every((v1, index) => {
    const v2 = sorted2[index];
    if (!v2) return false;
    const option1 = getOptionId(v1.option);
    const option2 = getOptionId(v2.option);
    return option1 === option2 && v1.value === v2.value;
  });
}
