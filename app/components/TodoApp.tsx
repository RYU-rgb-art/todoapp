"use client";

import { useState, useEffect, useRef } from "react";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

type Filter = "all" | "active" | "completed";

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("todos");
    if (stored) {
      setTodos(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInput("");
    inputRef.current?.focus();
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const removeTodo = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 150);
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen flex items-start justify-center pt-16 pb-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-light tracking-widest text-stone-800 mb-1">
            TODO
          </h1>
          <p className="text-sm text-stone-400">
            {activeCount > 0 ? `${activeCount}件の未完了タスク` : "すべて完了しています"}
          </p>
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-6">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="新しいタスクを入力..."
            className="flex-1 px-4 py-3 rounded-xl bg-white border border-stone-200 text-stone-800 placeholder-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition shadow-sm"
          />
          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="px-5 py-3 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 active:bg-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
          >
            追加
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-stone-100 rounded-xl">
          {(["all", "active", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {f === "all" ? "すべて" : f === "active" ? "未完了" : "完了済み"}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 text-stone-300 text-sm">
              タスクがありません
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`group flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-stone-100 shadow-sm transition ${
                  removingIds.has(todo.id) ? "task-exit" : "task-enter"
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                    todo.completed
                      ? "bg-emerald-400 border-emerald-400"
                      : "border-stone-300 hover:border-stone-400"
                  }`}
                  aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
                >
                  {todo.completed && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Text */}
                <span
                  className={`flex-1 text-sm transition ${
                    todo.completed ? "text-stone-300 line-through" : "text-stone-700"
                  }`}
                >
                  {todo.text}
                </span>

                {/* Delete */}
                <button
                  onClick={() => removeTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-400 transition"
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
                const completedIds = todos.filter((t) => t.completed).map((t) => t.id);
                completedIds.forEach((id) => {
                  setRemovingIds((prev) => new Set(prev).add(id));
                });
                setTimeout(() => {
                  setTodos((prev) => prev.filter((t) => !t.completed));
                  setRemovingIds(new Set());
                }, 150);
              }}
              className="text-xs text-stone-300 hover:text-red-400 transition"
            >
              完了済みをすべて削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
