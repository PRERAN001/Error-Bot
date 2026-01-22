import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function CronDashboard() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    name: "",
    url: "",
    schedule: "rate(10 minutes)",
  });

  const addJob = async () => {
    await fetch("/jobs", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer <your-aws-iam-token>",
      },
      method: "POST",
      data: JSON.stringify({
        form
      }),
    })
    if (!form.name || !form.url) {
      alert("Name and URL required");
      return;
    }

    setJobs([
      ...jobs,
      {
        id: Date.now(),
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
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Cron Dashboard</h1>

      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Cron Job</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <input
            className="border p-2 rounded"
            placeholder="Job name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
          <input
            className="border p-2 rounded"
            placeholder="https://example.com"
            value={form.url}
            onChange={(e) =>
              setForm({ ...form, url: e.target.value })
            }
          />
          <select
            className="border p-2 rounded"
            value={form.schedule}
            onChange={(e) =>
              setForm({ ...form, schedule: e.target.value })
            }
          >
            <option value="rate(5 minutes)">Every 5 minutes</option>
            <option value="rate(10 minutes)">Every 10 minutes</option>
            <option value="rate(30 minutes)">Every 30 minutes</option>
            <option value="rate(1 hour)">Every 1 hour</option>
          </select>
        </div>

        <button
          onClick={addJob}
          className="mt-4 flex items-center gap-2 bg-black text-white px-4 py-2 rounded"
        >
          <Plus size={18} /> Add Job
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Scheduled Jobs</h2>

        {jobs.length === 0 && (
          <p className="text-gray-500">No jobs yet</p>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex justify-between items-center border p-4 rounded mb-2"
          >
            <div>
              <h3 className="font-semibold">{job.name}</h3>
              <p className="text-sm text-gray-500">{job.url}</p>
              <p className="text-xs text-gray-400">{job.schedule}</p>
            </div>

            <button
              onClick={() => deleteJob(job.id)}
              className="text-red-500"
            >
              <Trash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
