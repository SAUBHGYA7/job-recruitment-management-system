import React, { useState, useEffect } from 'react';
import { Download, FileText, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function UserReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await api.get('/reports/user');
        if (res.data?.data) {
          setReports(res.data.data);
        }
      } catch {
        addToast('Failed to generate user reports', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${filename}.csv`, 'success');
  };

  if (loading) return <Loader text="Generating recruitment reports from Oracle Database..." />;
  if (!reports) return <div className="p-8 text-center text-xs text-slate-500">No report data generated.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Recruitment Analytics &amp; Reports</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Exportable SQL aggregations directly generated from Oracle tables.
        </p>
      </div>

      {/* Report 1: Applications Pipeline */}
      <div className="panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Application Pipeline Summary
            </h3>
            <p className="text-[11px] text-slate-500">Candidate ⨝ Application ⨝ Job_Details</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            icon={Download}
            onClick={() => exportCSV(reports.appReport, 'applications_report')}
          >
            Export CSV
          </Button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>App ID</th>
                <th>Candidate Name</th>
                <th>Job Title</th>
                <th>Status</th>
                <th>Final Outcome</th>
              </tr>
            </thead>
            <tbody>
              {reports.appReport?.map((r, idx) => (
                <tr key={idx}>
                  <td className="font-mono text-blue-400">{r.app_id}</td>
                  <td className="font-semibold text-white">{r.candidate_name}</td>
                  <td className="text-slate-300">{r.job_title}</td>
                  <td>
                    <Badge variant={r.app_status === 'Shortlisted' ? 'success' : 'danger'}>{r.app_status}</Badge>
                  </td>
                  <td className="font-medium text-slate-200">{r.final_result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report 2: Skill Demand vs Supply */}
      <div className="panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Skill Demand vs. Talent Supply Matrix
            </h3>
            <p className="text-[11px] text-slate-500">Job Demand (Requires) vs. Candidate Supply (Has)</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            icon={Download}
            onClick={() => exportCSV(reports.skillReport, 'skill_gap_report')}
          >
            Export CSV
          </Button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Skill ID</th>
                <th>Skill Name</th>
                <th>Job Postings Requiring</th>
                <th>Candidates Possessing</th>
                <th>Market Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.skillReport?.map((sk, idx) => (
                <tr key={idx}>
                  <td className="font-mono text-amber-400">#{sk.skill_id}</td>
                  <td className="font-bold text-white">{sk.skill_name}</td>
                  <td className="font-mono text-blue-400">{sk.jobDemandCount} positions</td>
                  <td className="font-mono text-emerald-400">{sk.candidateSupplyCount} candidates</td>
                  <td>
                    <Badge variant={sk.gap > 0 ? 'warning' : 'success'}>
                      {sk.gap > 0 ? `Deficit (${sk.gap})` : 'Balanced'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
