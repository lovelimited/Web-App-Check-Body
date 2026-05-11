import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Users, Shirt, PersonStanding, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Award, ListChecks,
} from 'lucide-react';
import { getDashboard } from '../api';
import { getTodayTH, scoreBadge, ALL_CLASSES } from '../config';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, ChartDataLabels);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDashboard();
      if (!res.success) throw new Error(res.error);
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorBox msg={error} onRetry={load} />;

  const { summary, class_status, class_averages, passed, failed, recent } = data;
  const labels    = class_averages.map(c => c.class_level);
  const dressData = class_averages.map(c => c.avg_dress);
  const bodyData  = class_averages.map(c => c.avg_body);

  const barData = {
    labels,
    datasets: [
      { label: 'เครื่องแต่งกาย', data: dressData, backgroundColor: 'rgba(99,102,241,0.75)', borderRadius: 8 },
      { label: 'สภาพร่างกาย',   data: bodyData,  backgroundColor: 'rgba(168,85,247,0.75)', borderRadius: 8 },
    ],
  };
  const barOpts = {
    responsive: true,
    plugins: { 
      legend: { position: 'bottom' },
      datalabels: {
        anchor: 'end',
        align: 'top',
        formatter: (val) => val > 0 ? val.toFixed(1) : '',
        font: { weight: 'bold', size: 11 },
        color: '#4338ca'
      }
    },
    scales: { y: { min: 0, max: 11, ticks: { stepSize: 2 } } },
  };

  const pieData = {
    labels: [`ผ่าน (≥14)`, `ไม่ผ่าน (<14)`],
    datasets: [{ data: [passed, failed], backgroundColor: ['#10B981', '#F87171'], borderWidth: 3, borderColor: '#fff' }],
  };
  const pieOpts = { 
    responsive: true, 
    plugins: { 
      legend: { position: 'bottom' },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 14 },
        formatter: (value, ctx) => {
          let sum = 0;
          let dataArr = ctx.chart.data.datasets[0].data;
          dataArr.map(data => { sum += data; });
          let percentage = (value * 100 / sum).toFixed(0) + "%";
          return value > 0 ? `${value} คน\n(${percentage})` : '';
        },
        textAlign: 'center'
      }
    } 
  };

  const notDone = class_status.filter(c => !c.submitted).map(c => c.class_level);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-indigo-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{getTodayTH()}</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-1.5 text-sm">
          <RefreshCw className="w-4 h-4" /> รีเฟรช
        </button>
      </div>

      {/* Alert: not done */}
      {notDone.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-700">ยังไม่ได้กรอกข้อมูล</p>
            <p className="text-sm text-amber-600">{notDone.join(', ')}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="นักเรียนตรวจแล้ว" value={summary.total} unit="คน"
          colorClass="border-blue-400 bg-blue-50 text-blue-700" Icon={Users} />
        <StatCard label="เฉลี่ยเครื่องแต่งกาย" value={summary.avg_dress} unit="/10"
          colorClass="border-indigo-400 bg-indigo-50 text-indigo-700" Icon={Shirt} />
        <StatCard label="เฉลี่ยสภาพร่างกาย" value={summary.avg_body} unit="/10"
          colorClass="border-purple-400 bg-purple-50 text-purple-700" Icon={PersonStanding} />
      </div>

      {/* Class Status */}
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-indigo-500" /> สถานะรายชั้น
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {class_status.map(c => (
            <div key={c.class_level}
              className={`text-center p-3 rounded-xl border transition-all ${c.submitted
                ? 'bg-green-50 border-green-200 pulse-green' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-center mb-1">
                {c.submitted
                  ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                  : <Clock className="w-6 h-6 text-red-400" />}
              </div>
              <div className={`font-bold text-sm ${c.submitted ? 'text-green-700' : 'text-red-500'}`}>
                {c.class_level}
              </div>
              {c.total_students > 0 ? (
                <div className="text-xs mt-0.5">
                  <span className={`font-semibold ${c.submitted ? 'text-green-600' : 'text-red-400'}`}>
                    {c.count}
                  </span>
                  <span className="text-gray-400">/{c.total_students} คน</span>
                </div>
              ) : (
                <div className="text-xs text-gray-400">{c.count} คน</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> คะแนนเฉลี่ยแต่ละชั้น
          </h2>
          <Bar data={barData} options={barOpts} />
        </div>
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" /> ผ่าน / ไม่ผ่าน (รวม ≥ 14)
          </h2>
          {(passed + failed) > 0
            ? <Doughnut data={pieData} options={pieOpts} />
            : <p className="text-gray-400 text-center py-16">ยังไม่มีข้อมูล</p>
          }
        </div>
      </div>

      {/* Recent Table */}
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" /> รายการล่าสุด (10 คน)
        </h2>
        {recent.length === 0
          ? <p className="text-gray-400 text-center py-8">ยังไม่มีข้อมูลวันนี้</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-50 text-indigo-700 text-left">
                    <th className="p-2 rounded-l-lg">ชั้น</th>
                    <th className="p-2">ชื่อ–สกุล</th>
                    <th className="p-2 text-center">เครื่องแต่งกาย</th>
                    <th className="p-2 text-center">สภาพร่างกาย</th>
                    <th className="p-2 text-center rounded-r-lg">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="p-2 font-semibold text-indigo-600">{r.class_level}</td>
                      <td className="p-2">
                        <span className="font-medium">{r.prefix}{r.first_name} {r.last_name}</span>
                        {r.nickname && <span className="text-xs text-gray-400 ml-1">"{r.nickname}"</span>}
                      </td>
                      <td className="p-2 text-center"><ScoreBadge n={r.score_dress} /></td>
                      <td className="p-2 text-center"><ScoreBadge n={r.score_body} /></td>
                      <td className="p-2 text-center">
                        <span className={`font-black text-base ${r.total >= 14 ? 'text-green-600' : 'text-red-500'}`}>
                          {r.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, colorClass, Icon }) {
  return (
    <div className={`card border-t-4 text-center ${colorClass}`}>
      <div className="flex justify-center mb-1">
        <Icon className="w-6 h-6 opacity-70" />
      </div>
      <div className="text-3xl font-black">{value ?? '-'}</div>
      <div className="text-xs opacity-70 mt-1">{label}</div>
    </div>
  );
}

function ScoreBadge({ n }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${scoreBadge(n)}`}>
      {n}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-indigo-600 font-medium">กำลังโหลดข้อมูล...</p>
    </div>
  );
}

function ErrorBox({ msg, onRetry }) {
  return (
    <div className="card text-center py-12 space-y-4">
      <AlertTriangle className="w-14 h-14 text-red-400 mx-auto" />
      <p className="text-red-600 font-semibold">{msg}</p>
      <button onClick={onRetry} className="btn-primary">ลองใหม่</button>
    </div>
  );
}
