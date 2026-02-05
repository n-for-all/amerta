import { FormControl, FormField, FormItem, FormMessage } from "@/amerta/theme/ui/form";

export const OrderNote = ({ form }: { form: any }) => {
  return (
    <div className="pt-10 mt-10 border-t border-zinc-200 dark:border-zinc-800">
      <h3 className="text-2xl font-medium">
        <span className="font-serif italic">Order</span> notes (optional)
      </h3>
      <FormField
        control={form.control}
        name="orderNote"
        render={({ field }) => (
          <FormItem className="mt-6">
            <FormControl>
              <textarea {...field} rows={3} className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 resize-none dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-50" placeholder="Add any special instructions..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
