import { useState } from "react";
import { Plus, Trash2, Moon, Sun } from "lucide-react";

export default function CronDashboard() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    name: "",
    url: "",
    schedule: "rate(10 minutes)",
  });

  const [dark, setDark] = useState(false);

  const addJob = async () => {
    if (!form.name || !form.url) {
      alert("Name and URL required");
      return;
    }

    const res = await fetch(
      "https://dmn0l3ong9.execute-api.us-west-2.amazonaws.com/jobs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          schedule: form.schedule,
        }),
      },
    );

    const data = await res.json();

    setJobs([
      ...jobs,
      {
        id: data.jobId,
        ...form,
        status: "ENABLED",
      },
    ]);

    setForm({ name: "", url: "", schedule: "rate(10 minutes)" });
  };

  const deleteJob = (id) => {
    setJobs(jobs.filter((j) => j.id !== id));
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        dark ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"
      } p-8`}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Cron Dashboard</h1>

        <button
          onClick={() => setDark(!dark)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm hover:opacity-80"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid gap-8">
        {/* Create Job */}
        <div
          className={`rounded-2xl p-6 shadow-sm ${
            dark ? "bg-zinc-900 border border-zinc-800" : "bg-white"
          }`}
        >
          <h2 className="text-xl font-semibold mb-6">Create Cron Job</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <input
              className="border rounded-lg px-3 py-2 
text-zinc-900 dark:text-zinc-100 
placeholder:text-zinc-400 dark:placeholder:text-zinc-500
bg-white dark:bg-zinc-950 
border-zinc-300 dark:border-zinc-700
focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600
transition"
              placeholder="Job name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 
text-zinc-900 dark:text-zinc-100 
placeholder:text-zinc-400 dark:placeholder:text-zinc-500
bg-white dark:bg-zinc-950 
border-zinc-300 dark:border-zinc-700
focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600
transition"
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
            <select
              className="border rounded-lg px-3 py-2 
text-zinc-900 dark:text-zinc-100 
placeholder:text-zinc-400 dark:placeholder:text-zinc-500
bg-white dark:bg-zinc-950 
border-zinc-300 dark:border-zinc-700
focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600
transition"
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
            >
              <option value="rate(5 minutes)">Every 5 minutes</option>
              <option value="rate(10 minutes)">Every 10 minutes</option>
              <option value="rate(30 minutes)">Every 30 minutes</option>
              <option value="rate(1 hour)">Every 1 hour</option>
            </select>
          </div>

          <button
            onClick={addJob}
            className="mt-6 inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:opacity-90"
          >
            <Plus size={18} />
            Add Job
          </button>
        </div>

        {/* Jobs List */}
        <div
          className={`rounded-2xl p-6 shadow-sm ${
            dark ? "bg-zinc-900 border border-zinc-800" : "bg-white"
          }`}
        >
          <h2 className="text-xl font-semibold mb-4">Scheduled Jobs</h2>

          {jobs.length === 0 && (
            <p className="text-sm text-zinc-500">No jobs created yet</p>
          )}

          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`flex justify-between items-center rounded-xl p-4 border ${
                  dark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200"
                }`}
              >
                <div>
                  <h3 className="font-semibold">{job.name}</h3>
                  <p className="text-sm text-zinc-500">{job.url}</p>
                  <p className="text-xs text-zinc-400 mt-1">{job.schedule}</p>
                </div>

                <button
                  onClick={() => deleteJob(job.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
