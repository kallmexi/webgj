import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Wallet, ShoppingCart, Bike, Target, PieChart, Plus, Trash2, 
  ChevronRight, Calendar, Bell, ShieldCheck, CreditCard,
  ArrowUpRight, ArrowDownRight, Zap, Clock, Settings, LogOut, 
  Filter, Download, Search, Briefcase, TrendingDown, TrendingUp, Eye, EyeOff,
  Star, Info, AlertCircle, Share2, Layers, CheckCircle2
} from 'lucide-react';

// Firebase Config
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'finance-garage-ultra';

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [salaryData, setSalaryData] = useState([]);
  const [shoppingData, setShoppingData] = useState([]);
  const [motorData, setMotorData] = useState([]);
  const [savingsData, setSavingsData] = useState([]);

  // Form States
  const [forms, setForms] = useState({
    salary: { label: '', amount: '', type: 'income' },
    shopping: { item: '', price: '' },
    motor: { part: '', price: '', status: 'wishlist' },
    savings: { goal: '', target: '', current: '' }
  });

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const getCol = (name) => collection(db, 'artifacts', appId, 'users', user.uid, name);

    const unsubSalary = onSnapshot(getCol('salary'), (s) => setSalaryData(s.docs.map(d => ({id: d.id, ...d.data()}))), (e) => console.error(e));
    const unsubShopping = onSnapshot(getCol('shopping'), (s) => setShoppingData(s.docs.map(d => ({id: d.id, ...d.data()}))), (e) => console.error(e));
    const unsubMotor = onSnapshot(getCol('motor'), (s) => setMotorData(s.docs.map(d => ({id: d.id, ...d.data()}))), (e) => console.error(e));
    const unsubSavings = onSnapshot(getCol('savings'), (s) => setSavingsData(s.docs.map(d => ({id: d.id, ...d.data()}))), (e) => console.error(e));

    return () => { unsubSalary(); unsubShopping(); unsubMotor(); unsubSavings(); };
  }, [user]);

  const totals = useMemo(() => {
    const income = salaryData.filter(d => d.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const expense = salaryData.filter(d => d.type === 'expense').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const shop = shoppingData.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    const motor = motorData.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    const saved = savingsData.reduce((acc, curr) => acc + (Number(curr.current) || 0), 0);
    
    return {
      income, 
      expense, 
      balance: income - expense - shop,
      totalShopping: shop, 
      totalMotor: motor, 
      totalSaved: saved,
      monthlyBurnRate: (expense + shop) / 30
    };
  }, [salaryData, shoppingData, motorData, savingsData]);

  const filteredShopping = shoppingData.filter(s => s.item.toLowerCase().includes(searchQuery.toLowerCase()));

  const addEntry = async (type) => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', appId, 'users', user.uid, type);
    await addDoc(colRef, { ...forms[type], createdAt: new Date().toISOString() });
    setForms(f => ({...f, [type]: { ...f[type], label: '', item: '', part: '', goal: '', amount: '', price: '', target: '', current: '' }}));
  };

  const deleteEntry = async (type, id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, type, id));
  };

  const toggleMotorStatus = async (id, currentStatus) => {
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'motor', id);
    await updateDoc(docRef, { status: currentStatus === 'wishlist' ? 'installed' : 'wishlist' });
  };

  const formatIDR = (val) => {
    if (!showValues) return "••••••••";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p>MENGHUBUNGKAN KE CLOUD...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 font-sans pb-32 xl:pb-10">
      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#0a0d14] border-r border-slate-800/50 hidden xl:flex flex-col p-8 z-50">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl">
            <Zap size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">ULTRA FIN</h1>
            <p className="text-[10px] text-blue-500 font-bold uppercase">Enterprise</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavBtn id="dashboard" icon={PieChart} label="Dashboard" active={activeTab} onClick={setActiveTab} />
          <NavBtn id="salary" icon={Briefcase} label="Gaji & Arus Kas" active={activeTab} onClick={setActiveTab} />
          <NavBtn id="shopping" icon={ShoppingCart} label="Belanja Kebutuhan" active={activeTab} onClick={setActiveTab} />
          <NavBtn id="motor" icon={Bike} label="Proyek Motor" active={activeTab} onClick={setActiveTab} />
          <NavBtn id="savings" icon={Target} label="Tabungan Aset" active={activeTab} onClick={setActiveTab} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="xl:ml-72 p-4 md:p-10 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight capitalize">{activeTab}</h2>
            <p className="text-slate-500 text-sm">Monitoring Finansial & Garasi Pro</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                placeholder="Cari data..." 
                className="bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 w-full md:w-64"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button onClick={() => setShowValues(!showValues)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl">
              {showValues ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Sisa Saldo" value={totals.balance} sub="Uang siap pakai" variant="emerald" />
              <StatCard title="Total Gaji" value={totals.income} sub="Bulan ini" variant="blue" />
              <StatCard title="Total Belanja" value={totals.totalShopping} sub="Kebutuhan rutin" variant="orange" />
              <StatCard title="Total Aset" value={totals.totalSaved} sub="Dana tabungan" variant="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#0a0d14] p-8 rounded-[2rem] border border-slate-800/50">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-8">
                    <TrendingUp size={20} className="text-emerald-500" /> Alokasi Dana
                  </h3>
                  <div className="space-y-8">
                    <BarProgress label="Belanja" value={totals.totalShopping} total={totals.income} color="from-blue-500 to-indigo-500" icon={ShoppingCart} />
                    <BarProgress label="Motor" value={totals.totalMotor} total={totals.income} color="from-orange-500 to-amber-500" icon={Bike} />
                    <BarProgress label="Tabungan" value={totals.totalSaved} total={totals.income} color="from-purple-500 to-pink-500" icon={Target} />
                  </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Info size={20} /></div>
                    <p className="font-bold text-white text-sm">Burn Rate Harian</p>
                  </div>
                  <p className="text-xl font-black text-white">{formatIDR(totals.monthlyBurnRate)}</p>
                </div>
              </div>

              <div className="bg-[#0a0d14] p-8 rounded-[2rem] border border-slate-800/50">
                <h3 className="text-xl font-bold text-white mb-6">Aktivitas Terakhir</h3>
                <div className="space-y-4">
                  {[...salaryData, ...shoppingData, ...motorData].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6).map((log, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-800/30 rounded-xl transition-all">
                      <div className={`w-1.5 h-1.5 rounded-full ${log.amount ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{log.label || log.item || log.part}</p>
                      </div>
                      <p className="text-xs font-mono font-bold text-white">{formatIDR(log.amount || log.price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'salary' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 self-start">
              <h3 className="text-xl font-bold mb-6 text-white">Input Arus Kas</h3>
              <div className="space-y-4">
                <input className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white outline-none" 
                  placeholder="Keterangan..." value={forms.salary.label} onChange={e => setForms({...forms, salary: {...forms.salary, label: e.target.value}})}/>
                <input type="number" className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white outline-none" 
                  placeholder="Nominal..." value={forms.salary.amount} onChange={e => setForms({...forms, salary: {...forms.salary, amount: e.target.value}})}/>
                <div className="flex gap-2">
                  <button onClick={() => setForms({...forms, salary: {...forms.salary, type: 'income'}})} 
                    className={`flex-1 py-3 rounded-xl text-xs font-bold ${forms.salary.type === 'income' ? 'bg-emerald-600' : 'bg-slate-800 text-slate-500'}`}>Income</button>
                  <button onClick={() => setForms({...forms, salary: {...forms.salary, type: 'expense'}})} 
                    className={`flex-1 py-3 rounded-xl text-xs font-bold ${forms.salary.type === 'expense' ? 'bg-red-600' : 'bg-slate-800 text-slate-500'}`}>Expense</button>
                </div>
                <button onClick={() => addEntry('salary')} className="w-full bg-blue-600 py-4 rounded-2xl font-black mt-2">SIMPAN</button>
              </div>
            </div>
            <div className="lg:col-span-2 bg-[#0a0d14] rounded-[2rem] border border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                  <tr>
                    <th className="p-6">Keterangan</th>
                    <th className="p-6">Nominal</th>
                    <th className="p-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {salaryData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="p-6 font-bold">{item.label}</td>
                      <td className={`p-6 font-mono font-bold ${item.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {item.type === 'income' ? '+' : '-'} {formatIDR(item.amount)}
                      </td>
                      <td className="p-6"><button onClick={() => deleteEntry('salary', item.id)} className="text-slate-700 hover:text-red-500"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'shopping' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 flex flex-col md:flex-row gap-4 items-end">
              <input className="flex-1 bg-slate-800 rounded-2xl p-4 text-white outline-none" placeholder="Nama barang..." 
                value={forms.shopping.item} onChange={e => setForms({...forms, shopping: {...forms.shopping, item: e.target.value}})} />
              <input type="number" className="w-full md:w-48 bg-slate-800 rounded-2xl p-4 text-white outline-none" placeholder="Harga..." 
                value={forms.shopping.price} onChange={e => setForms({...forms, shopping: {...forms.shopping, price: e.target.value}})} />
              <button onClick={() => addEntry('shopping')} className="bg-emerald-600 px-8 py-4 rounded-2xl font-black">TAMBAH</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShopping.map(item => (
                <div key={item.id} className="bg-[#0a0d14] p-6 rounded-3xl border border-slate-800 flex justify-between items-center group">
                  <div>
                    <h4 className="font-bold text-white">{item.item}</h4>
                    <p className="text-xl font-black text-blue-500">{formatIDR(item.price)}</p>
                  </div>
                  <button onClick={() => deleteEntry('shopping', item.id)} className="text-slate-800 hover:text-red-500"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'motor' && (
          <div className="space-y-8">
             <div className="bg-gradient-to-r from-blue-600 to-indigo-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-4 text-white shadow-xl">
               <div>
                 <h3 className="text-3xl font-black italic">GARASI PRO</h3>
                 <p className="text-sm opacity-80 font-bold uppercase tracking-widest">Total Estimasi Proyek</p>
               </div>
               <p className="text-4xl font-black">{formatIDR(totals.totalMotor)}</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900/50 p-6 rounded-[2rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                   <input className="bg-transparent text-center font-bold text-white outline-none text-sm" placeholder="Part Baru..." 
                    value={forms.motor.part} onChange={e => setForms({...forms, motor: {...forms.motor, part: e.target.value}})} />
                   <input type="number" className="bg-transparent text-center text-xs text-slate-500 outline-none" placeholder="Rp 0" 
                    value={forms.motor.price} onChange={e => setForms({...forms, motor: {...forms.motor, price: e.target.value}})} />
                   <button onClick={() => addEntry('motor')} className="bg-white text-black p-2 rounded-full"><Plus size={20}/></button>
                </div>
                {motorData.map(item => (
                  <div key={item.id} className="bg-[#0a0d14] p-6 rounded-[2rem] border border-slate-800 relative group">
                    <button onClick={() => deleteEntry('motor', item.id)} className="absolute top-4 right-4 text-slate-800 hover:text-red-500"><Trash2 size={16}/></button>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.status === 'installed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {item.status === 'installed' ? <CheckCircle2 size={20}/> : <Bike size={20}/>}
                    </div>
                    <h4 className="font-bold text-white mb-1 truncate">{item.part}</h4>
                    <p className="text-lg font-black text-slate-400 mb-4">{formatIDR(item.price)}</p>
                    <button onClick={() => toggleMotorStatus(item.id, item.status)} 
                      className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.status === 'installed' ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 hover:bg-blue-600 hover:text-white'}`}>
                      {item.status === 'installed' ? 'Terpasang' : 'Wishlist'}
                    </button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 h-fit">
              <h3 className="text-xl font-bold text-white mb-6">Target Aset Baru</h3>
              <div className="space-y-4">
                <input className="w-full bg-slate-800 rounded-2xl p-4 text-white outline-none" placeholder="Target (e.g. Tabungan Umroh)" 
                  value={forms.savings.goal} onChange={e => setForms({...forms, savings: {...forms.savings, goal: e.target.value}})} />
                <div className="flex gap-4">
                  <input type="number" className="flex-1 bg-slate-800 rounded-2xl p-4 text-white outline-none" placeholder="Goal (Rp)" 
                    value={forms.savings.target} onChange={e => setForms({...forms, savings: {...forms.savings, target: e.target.value}})} />
                  <input type="number" className="flex-1 bg-slate-800 rounded-2xl p-4 text-white outline-none" placeholder="Awal (Rp)" 
                    value={forms.savings.current} onChange={e => setForms({...forms, savings: {...forms.savings, current: e.target.value}})} />
                </div>
                <button onClick={() => addEntry('savings')} className="w-full bg-purple-600 py-4 rounded-2xl font-black mt-2">MULAI NABUNG</button>
              </div>
            </div>
            <div className="space-y-6">
              {savingsData.map(item => {
                const pct = Math.min((item.current / item.target) * 100, 100).toFixed(0);
                return (
                  <div key={item.id} className="bg-[#0a0d14] p-8 rounded-[2.5rem] border border-slate-800">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                         <h4 className="text-xl font-black text-white">{item.goal}</h4>
                         <p className="text-xs text-slate-500 font-bold uppercase">{formatIDR(item.target)}</p>
                       </div>
                       <button onClick={() => deleteEntry('savings', item.id)} className="text-slate-800 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black text-purple-400 uppercase">
                          <span>Progress</span>
                          <span>{pct}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-1000" style={{width: `${pct}%`}} />
                       </div>
                       <p className="text-xs text-slate-600 text-center pt-2 italic">Terkumpul {formatIDR(item.current)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 xl:hidden flex justify-around items-center px-4 z-[100]">
        <MobileNavBtn id="dashboard" icon={PieChart} active={activeTab} onClick={setActiveTab} />
        <MobileNavBtn id="salary" icon={Briefcase} active={activeTab} onClick={setActiveTab} />
        <div className="relative -mt-10">
           <button onClick={() => setActiveTab('shopping')} className="bg-blue-600 text-white p-4 rounded-2xl shadow-2xl border-4 border-slate-950">
             <Plus size={24} />
           </button>
        </div>
        <MobileNavBtn id="motor" icon={Bike} active={activeTab} onClick={setActiveTab} />
        <MobileNavBtn id="savings" icon={Target} active={activeTab} onClick={setActiveTab} />
      </nav>
    </div>
  );
};

const NavBtn = ({ id, icon: Icon, label, active, onClick }) => (
  <button onClick={() => onClick(id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${active === id ? 'bg-blue-600 text-white shadow-lg translate-x-1' : 'text-slate-500 hover:bg-slate-900'}`}>
    <Icon size={20} strokeWidth={active === id ? 3 : 2} />
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const MobileNavBtn = ({ id, icon: Icon, active, onClick }) => (
  <button onClick={() => onClick(id)} className={`p-4 transition-all ${active === id ? 'text-blue-500' : 'text-slate-600'}`}>
    <Icon size={24} strokeWidth={active === id ? 3 : 2} />
  </button>
);

const StatCard = ({ title, value, sub, variant }) => {
  const colors = {
    blue: 'text-blue-500',
    emerald: 'text-emerald-500',
    orange: 'text-orange-500',
    purple: 'text-purple-500'
  };
  return (
    <div className="bg-[#0a0d14] p-8 rounded-[2.5rem] border border-slate-800">
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{title}</p>
       <h3 className={`text-2xl font-black mb-1 ${colors[variant]}`}>{typeof value === 'number' ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value) : value}</h3>
       <p className="text-[10px] text-slate-600 font-bold uppercase">{sub}</p>
    </div>
  );
};

const BarProgress = ({ label, value, total, color, icon: Icon }) => {
  const pct = total > 0 ? Math.min((value / total) * 100, 100).toFixed(0) : 0;
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2"><Icon size={12}/> {label}</div>
          <span>{pct}%</span>
       </div>
       <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${color} transition-all duration-1000`} style={{width: `${pct}%`}} />
       </div>
    </div>
  );
};

export default App;
