"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
type Props = {
  role: {
    id: string;
    name: string;
    description: string;
    responsibilities: {
      every_morning: string[];
      every_customer: string[];
      requires_approval: string[];
    };
  };
  processes: Array<{ id: string; title: string }>;
  assigned: string[];
};
export function RoleEditor({ role, processes, assigned }: Props) {
  const router = useRouter();
  const [data, setData] = useState({ ...role, processIds: assigned });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save() {
    const response = await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setMessage("Role saved and training assignments updated.");
    router.refresh();
  }
  function update(
    section: keyof Props["role"]["responsibilities"],
    index: number,
    value: string,
  ) {
    const responsibilities = {
      ...data.responsibilities,
      [section]: data.responsibilities[section].map((item, i) =>
        i === index ? value : item,
      ),
    };
    setData({ ...data, responsibilities });
  }
  function add(section: keyof Props["role"]["responsibilities"]) {
    setData({
      ...data,
      responsibilities: {
        ...data.responsibilities,
        [section]: [...data.responsibilities[section], ""],
      },
    });
  }
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-7">
        <label className="block text-xs font-semibold text-[#667184]">
          Role name
          <input
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] px-3.5 text-lg font-semibold"
          />
        </label>
        <label className="mt-5 block text-xs font-semibold text-[#667184]">
          Description
          <textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            rows={3}
            className="mt-2 w-full rounded-xl border border-[#d9e0e9] p-3.5 text-sm"
          />
        </label>
      </section>
      <div className="grid gap-5 xl:grid-cols-3">
        <Responsibility
          title="Every Morning"
          items={data.responsibilities.every_morning}
          add={() => add("every_morning")}
          update={(i, v) => update("every_morning", i, v)}
          remove={(i) =>
            setData({
              ...data,
              responsibilities: {
                ...data.responsibilities,
                every_morning: data.responsibilities.every_morning.filter(
                  (_, x) => x !== i,
                ),
              },
            })
          }
        />
        <Responsibility
          title="Every Customer"
          items={data.responsibilities.every_customer}
          add={() => add("every_customer")}
          update={(i, v) => update("every_customer", i, v)}
          remove={(i) =>
            setData({
              ...data,
              responsibilities: {
                ...data.responsibilities,
                every_customer: data.responsibilities.every_customer.filter(
                  (_, x) => x !== i,
                ),
              },
            })
          }
        />
        <Responsibility
          title="Requires Approval"
          items={data.responsibilities.requires_approval}
          add={() => add("requires_approval")}
          update={(i, v) => update("requires_approval", i, v)}
          remove={(i) =>
            setData({
              ...data,
              responsibilities: {
                ...data.responsibilities,
                requires_approval:
                  data.responsibilities.requires_approval.filter(
                    (_, x) => x !== i,
                  ),
              },
            })
          }
        />
      </div>
      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-7">
        <h2 className="font-semibold">Assigned processes</h2>
        <p className="mt-1 text-xs text-[#7a8698]">
          Employees in this role receive these as training.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {processes.map((process) => (
            <label
              key={process.id}
              className="flex items-center gap-3 rounded-xl border border-[#e1e6ed] p-3 text-sm font-medium"
            >
              <input
                type="checkbox"
                checked={data.processIds.includes(process.id)}
                onChange={(e) =>
                  setData({
                    ...data,
                    processIds: e.target.checked
                      ? [...data.processIds, process.id]
                      : data.processIds.filter((id) => id !== process.id),
                  })
                }
                className="size-4 accent-[#3158d8]"
              />
              {process.title}
            </label>
          ))}
        </div>
      </section>
      {error ? (
        <p className="rounded-xl bg-[#fff0f1] p-3 text-sm text-[#a83f49]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="flex items-center gap-2 rounded-xl bg-[#eaf7f1] p-3 text-sm text-[#177257]">
          <Check className="size-4" />
          {message}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          onClick={() => void save()}
          className="min-h-11 rounded-xl bg-[#3158d8] px-5 text-sm font-semibold text-white"
        >
          Save Role
        </button>
      </div>
    </div>
  );
}
function Responsibility({
  title,
  items,
  add,
  update,
  remove,
}: {
  title: string;
  items: string[];
  add: () => void;
  update: (index: number, value: string) => void;
  remove: (index: number) => void;
}) {
  return (
    <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5">
      <div className="flex justify-between">
        <h2 className="font-semibold">{title}</h2>
        <button
          onClick={add}
          className="grid size-7 place-items-center rounded-lg bg-[#f0f3f7]"
          aria-label={`Add ${title}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-1">
            <input
              value={item}
              onChange={(e) => update(index, e.target.value)}
              className="h-9 min-w-0 flex-1 rounded-lg border border-[#dfe5ed] px-2.5 text-xs"
            />
            <button
              onClick={() => remove(index)}
              aria-label="Remove"
              className="grid size-9 place-items-center text-[#8a95a5]"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {!items.length ? (
          <p className="text-xs text-[#8a95a5]">Nothing added yet.</p>
        ) : null}
      </div>
    </section>
  );
}
