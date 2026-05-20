"use client";

import { useState, useEffect, useRef } from "react";

type Priority = "high" | "medium" | "low";
type Category = "work" | "private" | "other";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: Priority;
  category: Category;
  deadline?: string;
};

type StatusFilter = "all" | "active" | "completed";

const PRIORITY_LABELS: Record<Priority, string> = { high: "高", medium: "中", low: "低" };
const PRIORITY_STYLES: Record<Priority, string> = {
  high: "text-red-400 bg-red-900/30 border border-red-800",
  medium: "text-amber-400 bg-amber-900/30 border border-amber-800",
  low: "text-emerald-400 bg-emerald-900/30 border border-emerald-800",
};
const CATEGORY_LABELS: Record<Category, string> = { work: "仕事", private: "プライベート", other: "その他" };
const CATEGORY_STYLES: Record<Category, string> = {
  work: "bg-blue-900/30 text-blue-400",
  private: "bg-violet-900/30 text-violet-400",
  other: "bg-slate-700 text-slate-400",
};

function CircularProgress({ rate }: { rate: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (rate / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r={r} fill="none" stroke="#334155" strokeWidth="8" />
          <circle
            cx="42" cy="42" r={r} fill="none"
            stroke="#38bdf8" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-sky-300">{Math.round(rate)}%</span>
        </div>
      </div>
      <span className="text-xs text-slate-500">完了率</span>
    </div>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newCategory, setNewCategory] = useState<Category>("work");
  const [newDeadline, setNewDeadline] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("todos-v2");
    if (stored) setTodos(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("todos-v2", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    const id = crypto.randomUUID();
    const newTodo: Todo = {
      id, text, completed: false, createdAt: Date.now(),
      priority: newPriority, category: newCategory,
      deadline: newDeadline || undefined,
    };
    setAddingIds((prev) => new Set(prev).add(id));
    setTodos((prev) => [newTodo, ...prev]);
    setInput("");
    setNewDeadline("");
    inputRef.current?.focus();
    setTimeout(() => {
      setAddingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }, 400);
  };

  const toggleTodo = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    if (!todo.completed) {
      setCompletingIds((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed: true } : t));
        setCompletingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      }, 350);
    } else {
      setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed: false } : t));
    }
  };

  const removeTodo = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setRemovingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }, 200);
  };

  const filteredTodos = todos.filter((t) => {
    if (statusFilter === "active" && t.completed) return false;
    if (statusFilter === "completed" && !t.completed) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;
  const completionRate = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  const isOverdue = (deadline?: string) =>
    !!deadline && new Date(deadline) < new Date(new Date().toDateString());

  return (
    <div className="min-h-screen flex items-start justify-center pt-10 pb-16 px-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-light tracking-widest text-sky-300 mb-1">TODO</h1>
          <p className="text-sm text-slate-500">
            {totalCount === 0
              ? "タスクを追加しましょう"
              : activeCount > 0
              ? `${activeCount}件の未完了タスク`
              : "すべて完了しています"}
          </p>
        </div>

        {/* Progress card */}
        {totalCount > 0 && (
          <div className="mb-5 p-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg flex items-center gap-5">
            <CircularProgress rate={completionRate} />
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-700 rounded-xl">
                <div className="text-2xl font-bold text-slate-200">{totalCount}</div>
                <div className="text-xs text-slate-500 mt-0.5">合計</div>
              </div>
              <div className="p-2 bg-slate-700 rounded-xl">
                <div className="text-2xl font-bold text-sky-400">{completedCount}</div>
                <div className="text-xs text-slate-500 mt-0.5">完了</div>
              </div>
              <div className="p-2 bg-slate-700 rounded-xl">
                <div className="text-2xl font-bold text-amber-400">{activeCount}</div>
                <div className="text-xs text-slate-500 mt-0.5">残り</div>
              </div>
            </div>
          </div>
        )}

        {/* Input card */}
        <div className="mb-5 p-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg space-y-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="新しいタスクを入力..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
            <button
              onClick={addTodo}
              disabled={!input.trim()}
              className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 active:bg-sky-600 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
            >
              追加
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">優先度</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">カテゴリー</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Category)}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              >
                <option value="work">仕事</option>
                <option value="private">プライベート</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">締め切り</label>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 space-y-2">
          <div className="flex gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700">
            {(["all", "active", "completed"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === f
                    ? "bg-slate-700 text-sky-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {f === "all" ? "すべて" : f === "active" ? "未完了" : "完了済み"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as "all" | Category)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="all">全カテゴリー</option>
              <option value="work">仕事</option>
              <option value="private">プライベート</option>
              <option value="other">その他</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as "all" | Priority)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="all">全優先度</option>
              <option value="high">優先度：高</option>
              <option value="medium">優先度：中</option>
              <option value="low">優先度：低</option>
            </select>
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 text-slate-600 text-sm">タスクがありません</div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`group flex items-start gap-3 px-4 py-3.5 bg-slate-800 rounded-xl border border-slate-700 shadow-sm transition-opacity ${
                  todo.completed ? "opacity-40" : "opacity-100"
                } ${removingIds.has(todo.id) ? "task-exit" : ""} ${
                  addingIds.has(todo.id) ? "task-enter" : ""
                } ${completingIds.has(todo.id) ? "task-complete" : ""}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    todo.completed
                      ? "bg-sky-500 border-sky-500"
                      : completingIds.has(todo.id)
                      ? "bg-sky-700 border-sky-700 scale-125"
                      : "border-slate-600 hover:border-sky-400 hover:scale-110"
                  }`}
                  aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
                >
                  {(todo.completed || completingIds.has(todo.id)) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm block transition ${todo.completed ? "text-slate-600 line-through" : "text-slate-100"}`}>
                    {todo.text}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[todo.category]}`}>
                      {CATEGORY_LABELS[todo.category]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[todo.priority]}`}>
                      {PRIORITY_LABELS[todo.priority]}
                    </span>
                    {todo.deadline && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isOverdue(todo.deadline) && !todo.completed
                          ? "bg-red-900/30 text-red-400"
                          : "bg-slate-700 text-slate-400"
                      }`}>
                        {isOverdue(todo.deadline) && !todo.completed ? "⚠ " : ""}
                        {todo.deadline}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-900/20 text-slate-600 hover:text-red-400 transition"
                  aria-label="削除"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {todos.some((t) => t.completed) && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                const ids = todos.filter((t) => t.completed).map((t) => t.id);
                ids.forEach((id) => setRemovingIds((prev) => new Set(prev).add(id)));
                setTimeout(() => {
                  setTodos((prev) => prev.filter((t) => !t.completed));
                  setRemovingIds(new Set());
                }, 200);
              }}
              className="text-xs text-slate-600 hover:text-red-400 transition"
            >
              完了済みをすべて削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
