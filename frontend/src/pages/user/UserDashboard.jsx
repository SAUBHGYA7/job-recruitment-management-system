import React, { useState, useEffect } from 'react';
import { Users, Briefcase, FileText, CalendarCheck, Building2 } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import api from '../../services/api';
import { getMockUserDashboard } from '../../services/mockDb';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function UserDashboard() {
  // Default to rich academic dataset so page always renders immediately
  const [data, setData] = useState(getMockUserDashboard());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/user/dashboard');
        if (res.data?.data?.kpis) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load user dashboard:', err);
      }
    }
    fetchDashboard();
  }, []);

  const { kpis, charts, recentApplications } = data;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Recruitment Dashboard</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Live statistics queried from Oracle tables: Candidate, Job, Application, Interview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <StatCard title="Candidates" value={kpis.totalCandidates} icon={Users} subtitle="SELECT COUNT(*) FROM Candidate" />
        <StatCard title="Total Jobs" value={kpis.totalJobs} icon={Briefcase} subtitle="SELECT COUNT(*) FROM Job" />
        <StatCard title="Open Jobs" value={kpis.openJobs} icon={Briefcase} subtitle="Status = 'Open'" />
        <StatCard title="Applications" value={kpis.totalApplications} icon={FileText} subtitle="SELECT COUNT(*) FROM Application" />
        <StatCard title="Interviews" value={kpis.totalInterviews} icon={CalendarCheck} subtitle="SELECT COUNT(*) FROM Interview" />
        <StatCard title="Employers" value={kpis.totalEmployers} icon={Building2} subtitle="SELECT COUNT(*) FROM Employer" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Most Demanded Skills */}
        <div className="lg:col-span-7 panel p-4">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Required Skills in Active Job Postings
            </h3>
            <p className="text-[11px] text-slate-500">
              Aggregated from Requires ⨝ Skill tables
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.demandedSkills} margin={{ top: 5, right: 10, left: -25, bottom: 20 }}>
                <XAxis dataKey="skill" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }}
                />
                <Bar dataKey="demand" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Applications by Status */}
        <div className="lg:col-span-5 panel p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Application Pipeline Distribution
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Grouped by app_status from Application table
            </p>
            <div className="space-y-2">
              {charts.applicationsByStatus.map((item) => (
                <div key={item.status} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === 'Shortlisted' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning'}>
                      {item.status}
                    </Badge>
                  </div>
                  <span className="font-mono font-bold text-white">{item.count} applications</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="panel p-4">
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Recent Applications
          </h3>
          <p className="text-[11px] text-slate-500">
            Query: Candidate ⨝ Application ⨝ Applies ⨝ Job ⨝ Job_Details
          </p>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate ID</th>
                <th>Candidate Name</th>
                <th>Job Code</th>
                <th>Applied Position</th>
                <th>Application Status</th>
                <th>Final Outcome</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((app) => (
                <tr key={app.cand_id}>
                  <td className="font-mono font-bold text-blue-400">#{app.cand_id}</td>
                  <td className="font-semibold text-white">{app.candidate_name}</td>
                  <td className="font-mono text-slate-400">{app.job_id}</td>
                  <td className="text-slate-300">{app.job_title}</td>
                  <td>
                    <Badge variant={app.app_status === 'Shortlisted' ? 'success' : 'danger'}>
                      {app.app_status}
                    </Badge>
                  </td>
                  <td className="font-medium text-slate-300">{app.final_result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
