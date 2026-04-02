import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, 
  Plus, 
  Search, 
  Settings, 
  LogOut, 
  ChevronRight, 
  MoreVertical, 
  UserPlus, 
  Download, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  Award,
  History,
  ArrowLeftRight,
  LayoutGrid,
  List as ListIcon,
  Filter,
  ClipboardList,
  Dices,
  RotateCcw,
  UserCheck,
  UserX,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { useRef } from 'react';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Supabase Configuration ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;
const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// --- Types ---
interface Student {
  id?: string; // Supabase UUID
  student_id: string; // Unique within room
  room_id: string;
  name: string;
  class_name: string;
  score: number;
  is_present: boolean;
  updated_at?: string;
}

interface HistoryEntry {
  id: string;
  room_id: string;
  student_id: string;
  student_name: string;
  action: 'score_change' | 'attendance_change' | 'edit' | 'add' | 'delete';
  details: string;
  timestamp: string;
  operator?: string;
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
      secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm',
      outline: 'bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg font-medium',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all',
        className
      )}
      {...props}
    />
  )
);

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, maxWidth?: string }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn("relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden my-auto", maxWidth)}
        >
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors">
              <XCircle className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(() => {
    return localStorage.getItem('classroom_room_id');
  });
  const [recentRooms, setRecentRooms] = useState<string[]>(() => {
    const saved = localStorage.getItem('classroom_recent_rooms');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (roomId) {
      localStorage.setItem('classroom_room_id', roomId);
      setRecentRooms(prev => {
        const next = [roomId, ...prev.filter(r => r !== roomId)].slice(0, 5);
        localStorage.setItem('classroom_recent_rooms', JSON.stringify(next));
        return next;
      });
    } else {
      localStorage.removeItem('classroom_room_id');
    }
  }, [roomId]);

  const [joinInput, setJoinInput] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [operatorName, setOperatorName] = useState<string>(() => {
    return localStorage.getItem('operator_name') || '';
  });
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [tempOperatorName, setTempOperatorName] = useState('');
  
  // Random Draw State
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [drawResults, setDrawResults] = useState<Student[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawFilters, setDrawFilters] = useState({
    className: 'All',
    onlyZeroScore: false,
    count: 1
  });

  // Batch Score State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [selectedBatchStudents, setSelectedBatchStudents] = useState<Student[]>([]);
  const [batchScoreDelta, setBatchScoreDelta] = useState(1);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ student_id: '', name: '', class_name: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Configuration Check ---
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Settings className="w-8 h-8 text-red-500 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">配置未完成</h1>
          <p className="text-slate-500 mb-6">
            请在 AI Studio 的 <b>Settings -&gt; Environment Variables</b> 中设置以下变量：
          </p>
          <div className="space-y-2 text-left bg-slate-50 p-4 rounded-xl font-mono text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">VITE_SUPABASE_URL</span>
              <span className="text-red-500">未设置</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">VITE_SUPABASE_ANON_KEY</span>
              <span className="text-red-500">未设置</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            设置完成后，请刷新页面。
          </p>
        </div>
      </div>
    );
  }

  // --- Room Logic ---
  const createRoom = () => {
    const newId = Math.floor(100000 + Math.random() * 900000).toString();
    setOperatorName('老师');
    localStorage.setItem('operator_name', '老师');
    setRoomId(newId);
  };

  const joinRoom = (id?: string) => {
    const targetId = id || joinInput;
    if (targetId.length === 6) {
      setRoomId(targetId);
      // Check if identity exists
      const savedName = localStorage.getItem('operator_name');
      if (!savedName) {
        setIsOperatorModalOpen(true);
      } else {
        setOperatorName(savedName);
      }
    }
  };

  const leaveRoom = () => {
    setRoomId(null);
    setStudents([]);
    setJoinInput('');
    // We don't necessarily clear operator_name here as per requirements, 
    // but if they join another room they might want to change it.
    // However, requirements say "if not stored, pop dialog".
  };

  // --- Data Fetching & Real-time ---
  useEffect(() => {
    if (!roomId || !supabase) return;

    const fetchStudents = async () => {
      if (!roomId || !supabase) return;
      
      setLoading(true);
      try {
        const [studentsRes, historyRes] = await Promise.all([
          supabase
            .from('students')
            .select('*')
            .eq('room_id', roomId)
            .order('student_id', { ascending: true }),
          supabase
            .from('history')
            .select('*')
            .eq('room_id', roomId)
            .order('timestamp', { ascending: false })
            .limit(50)
        ]);

        if (studentsRes.error) console.error('Fetch students error:', studentsRes.error);
        else setStudents(studentsRes.data || []);

        if (historyRes.error) {
          console.error('Fetch history error:', historyRes.error);
          // If table doesn't exist, we'll just have empty history
        } else {
          setHistory(historyRes.data || []);
        }
      } catch (err) {
        console.error('Unexpected fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();

    // Subscribe to real-time changes
    const studentsChannel = supabase
      .channel(`room-${roomId}-students`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setStudents(prev => {
              const exists = prev.find(s => s.student_id === payload.new.student_id);
              if (exists) return prev.map(s => s.student_id === payload.new.student_id ? (payload.new as Student) : s);
              return [...prev, payload.new as Student].sort((a, b) => a.student_id.localeCompare(b.student_id));
            });
          } else if (payload.eventType === 'UPDATE') {
            setStudents(prev => prev.map(s => s.student_id === payload.new.student_id ? (payload.new as Student) : s));
          } else if (payload.eventType === 'DELETE') {
            setStudents(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const historyChannel = supabase
      .channel(`room-${roomId}-history`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'history',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setHistory(prev => {
            // Avoid duplicates from manual optimistic updates
            if (prev.find(h => h.id === payload.new.id)) return prev;
            return [payload.new as HistoryEntry, ...prev].slice(0, 50);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'history',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setHistory(prev => prev.filter(h => h.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.warn('History Realtime subscription status:', status);
        }
      });

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(historyChannel);
    };
  }, [roomId]);

  // --- Student Operations ---
  const upsertStudent = async (studentData: Partial<Student>, skipHistory = false) => {
    if (!roomId || !supabase) return;
    
    const { error } = await supabase
      .from('students')
      .upsert({
        ...studentData,
        room_id: roomId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,room_id'
      });

    if (error) {
      console.error('Error upserting student:', error);
      alert('操作失败: ' + error.message);
    } else if (!skipHistory) {
      // Record history
      const original = studentData.id ? students.find(s => s.id === studentData.id) : null;
      
      const newEntry: Partial<HistoryEntry> = {
        room_id: roomId,
        student_id: studentData.student_id || (original?.student_id),
        student_name: studentData.name || (original?.name),
        action: studentData.id ? 'score_change' : 'add',
        details: JSON.stringify({
          prevScore: original?.score || 0,
          newScore: studentData.score,
          prevPresent: original?.is_present ?? true,
          newPresent: studentData.is_present ?? true,
          isNew: !studentData.id
        }),
        timestamp: new Date().toISOString(),
        operator: operatorName
      };
      
      const { data, error: histError } = await supabase
        .from('history')
        .insert(newEntry)
        .select()
        .single();
        
      if (!histError && data) {
        setHistory(prev => [data as HistoryEntry, ...prev].slice(0, 50));
      }
    }
  };

  const deleteStudent = async (student: Student) => {
    if (!window.confirm(`确定要删除学生 ${student.name} 吗？`) || !supabase) return;
    
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', student.id);
    
    if (error) {
      console.error('Error deleting student:', error);
      alert('删除失败: ' + error.message);
    } else {
      // Record in history
      const newEntry: Partial<HistoryEntry> = {
        room_id: roomId,
        student_id: student.student_id,
        student_name: student.name,
        action: 'delete',
        details: JSON.stringify(student),
        timestamp: new Date().toISOString(),
        operator: operatorName
      };
      
      const { data, error: histError } = await supabase
        .from('history')
        .insert(newEntry)
        .select()
        .single();
        
      if (!histError && data) {
        setHistory(prev => [data as HistoryEntry, ...prev].slice(0, 50));
      }
    }
  };

  const undoHistory = async (entry: HistoryEntry) => {
    const details = JSON.parse(entry.details);
    
    if (entry.action === 'delete') {
      // Re-insert the student
      const { id, ...studentWithoutId } = details;
      await upsertStudent(studentWithoutId, true);
      
      // Delete from DB
      await supabase.from('history').delete().eq('id', entry.id);
      setHistory(prev => prev.filter(h => h.id !== entry.id));
      return;
    }

    const student = students.find(s => s.student_id === entry.student_id);
    if (student) {
      await upsertStudent({
        ...student,
        score: details.prevScore,
        is_present: details.prevPresent
      }, true);
      
      // Delete from DB
      await supabase.from('history').delete().eq('id', entry.id);
      setHistory(prev => prev.filter(h => h.id !== entry.id));
    }
  };

  const updateScore = async (student: Student, delta: number) => {
    const updated = {
      ...student,
      score: Math.max(0, student.score + delta)
    };
    // Optimistic
    setStudents(prev => prev.map(s => s.id === student.id ? updated : s));
    // Update draw results if present
    setDrawResults(prev => prev.map(s => s.id === student.id ? updated : s));
    await upsertStudent(updated);
  };

  const setStudentScore = async (student: Student, newScore: number) => {
    const updated = {
      ...student,
      score: Math.max(0, newScore)
    };
    // Optimistic
    setStudents(prev => prev.map(s => s.id === student.id ? updated : s));
    // Update draw results if present
    setDrawResults(prev => prev.map(s => s.id === student.id ? updated : s));
    await upsertStudent(updated);
  };

  const toggleAttendance = async (student: Student) => {
    console.log('Toggling attendance for:', student.name, 'Current:', student.is_present);
    const updatedStudent = {
      ...student,
      is_present: !student.is_present,
      updated_at: new Date().toISOString()
    };
    
    // Optimistic UI update
    setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
    
    await upsertStudent(updatedStudent);
  };

  const pickRandomStudent = () => {
    let pool = students.filter(s => s.is_present);
    
    if (drawFilters.className !== 'All') {
      pool = pool.filter(s => s.class_name === drawFilters.className);
    }
    
    if (drawFilters.onlyZeroScore) {
      pool = pool.filter(s => s.score === 0);
    }

    if (pool.length === 0) {
      alert('没有符合条件的学生（必须是在位学生）');
      return;
    }

    const count = Math.max(1, Math.min(10, drawFilters.count || 1));
    setIsDrawing(true);
    setHasDrawn(true);
    setDrawResults([]);

    // Animation effect - Shuffle names rapidly
    let counter = 0;
    const interval = setInterval(() => {
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      setDrawResults(shuffled.slice(0, count));
      counter++;
      if (counter > 12) { // Slightly fewer iterations for snappier feel
        clearInterval(interval);
        const finalShuffled = [...pool].sort(() => 0.5 - Math.random());
        setDrawResults(finalShuffled.slice(0, count));
        setIsDrawing(false);
      }
    }, 80); // Faster interval
  };

  const applyBatchScore = async () => {
    if (selectedBatchStudents.length === 0 || !supabase || !roomId) return;
    
    setLoading(true);
    try {
      const updates = selectedBatchStudents.map(student => ({
        ...student,
        score: Math.max(0, student.score + batchScoreDelta),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('students')
        .upsert(updates, { onConflict: 'student_id,room_id' });

      if (error) throw error;

      // Record in history for each
      for (const student of selectedBatchStudents) {
        const newEntry: Partial<HistoryEntry> = {
          room_id: roomId,
          student_id: student.student_id,
          student_name: student.name,
          action: 'score_change',
          details: JSON.stringify({
            prevScore: student.score,
            newScore: student.score + batchScoreDelta,
            isBatch: true
          }),
          timestamp: new Date().toISOString(),
          operator: operatorName
        };
        await supabase.from('history').insert(newEntry);
      }

      alert(`✅ 成功为 ${selectedBatchStudents.length} 名学生更新分数！`);
      setIsBatchModalOpen(false);
      setSelectedBatchStudents([]);
      setBatchSearchQuery('');
    } catch (err: any) {
      console.error('Batch update error:', err);
      alert('❌ 批量更新失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getShortId = (id: string) => {
    if (id.length >= 3) return id.slice(-3);
    return id;
  };

  // --- Derived State ---
  const classes = useMemo(() => {
    const uniqueClasses = Array.from(new Set(students.map(s => s.class_name)));
    return ['All', ...uniqueClasses.sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter(s => {
      const matchesClass = selectedClass === 'All' || s.class_name === selectedClass;
      if (!q) return matchesClass;

      const matchesName = s.name.toLowerCase().includes(q);
      const matchesClassExact = s.class_name.toLowerCase() === q;
      
      // Smart Numeric ID match: handles 1, 01, 001 etc.
      const sId = s.student_id.trim();
      const sShortId = getShortId(sId);
      const sIdIsNumeric = /^\d+$/.test(sId);
      const sShortIdIsNumeric = /^\d+$/.test(sShortId);
      const qIsNumeric = /^\d+$/.test(q);
      
      let matchesId = false;
      if (qIsNumeric) {
        const qNum = parseInt(q, 10);
        const fullIdMatch = sIdIsNumeric && parseInt(sId, 10) === qNum;
        const shortIdMatch = sShortIdIsNumeric && parseInt(sShortId, 10) === qNum;
        matchesId = fullIdMatch || shortIdMatch;
      } else {
        matchesId = sId.toLowerCase() === q || sShortId.toLowerCase() === q;
      }

      // If it matches by ID or exact class name, show it globally
      if (matchesId || matchesClassExact) return true;
      
      // If it matches by name, respect class filter
      return matchesName && matchesClass;
    });
  }, [students, searchQuery, selectedClass]);

  const batchSearchResults = useMemo(() => {
    const q = batchSearchQuery.trim().toLowerCase();
    if (!q) return [];
    
    return students.filter(s => {
      const matchesName = s.name.toLowerCase().includes(q);
      const matchesClassExact = s.class_name.toLowerCase() === q;
      
      // Smart Numeric ID match
      const sId = s.student_id.trim();
      const sShortId = getShortId(sId);
      const sIdIsNumeric = /^\d+$/.test(sId);
      const sShortIdIsNumeric = /^\d+$/.test(sShortId);
      const qIsNumeric = /^\d+$/.test(q);
      
      let matchesId = false;
      if (qIsNumeric) {
        const qNum = parseInt(q, 10);
        const fullIdMatch = sIdIsNumeric && parseInt(sId, 10) === qNum;
        const shortIdMatch = sShortIdIsNumeric && parseInt(sShortId, 10) === qNum;
        matchesId = fullIdMatch || shortIdMatch;
      } else {
        matchesId = sId.toLowerCase() === q || sShortId.toLowerCase() === q;
      }

      const isAlreadySelected = selectedBatchStudents.some(selected => selected.id === s.id);
      return (matchesName || matchesId || matchesClassExact) && !isAlreadySelected;
    }).slice(0, 10); // Increased slice to 10 for better visibility
  }, [students, batchSearchQuery, selectedBatchStudents]);

  // --- Excel Import/Export ---
  const exportToExcel = () => {
    const data = filteredStudents.map(s => ({
      '学号': s.student_id,
      '姓名': s.name,
      '班级': s.class_name,
      '分数': s.score,
      '状态': s.is_present ? '在校' : '离校'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `Classroom_${roomId}_${selectedClass}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('开始处理文件:', file.name, '大小:', file.size, '类型:', file.type);
    
    if (!roomId) {
      alert('⚠️ 导入失败：请先在左侧“创建新班级”或输入房间号进入房间。');
      return;
    }
    
    if (!supabase) {
      alert('⚠️ 导入失败：数据库连接异常，请刷新页面。');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error('文件内容读取为空');
        
        // 自动识别文件类型并读取
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // header: 1 确保我们拿到的是原始数组，不依赖表头名称
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (!rawData || rawData.length === 0) {
          throw new Error('表格中没有任何数据，请检查文件内容。');
        }

        console.log('读取到原始数据行数:', rawData.length);

        // 严格按照用户要求的 3 列顺序处理：学号(0), 姓名(1), 班级(2)
        const studentsToUpsert = rawData
          .map((row, index) => {
            if (!row || row.length < 2) return null; // 至少要有学号和姓名

            const fullId = String(row[0] || '').trim();
            const name = String(row[1] || '').trim();
            let className = row[2] ? String(row[2]).trim() : '';
            
            // 基础校验
            if (!fullId || !name) {
              console.warn(`第 ${index + 1} 行数据不完整，已跳过:`, row);
              return null;
            }

            // 班级提取逻辑：如果第3列为空，则从学号提取
            // 规则：xxxxxx401001 -> 401 是班级 (倒数第6位到倒数第4位)
            if (!className || className === '' || className === 'undefined') {
              if (fullId.length >= 6) {
                className = fullId.slice(-6, -3);
              } else {
                className = '未分类';
              }
            }

            return {
              student_id: fullId,
              name: name,
              class_name: className,
              score: 0,
              is_present: true,
              room_id: roomId,
              updated_at: new Date().toISOString()
            };
          })
          .filter((s): s is any => s !== null);

        if (studentsToUpsert.length === 0) {
          throw new Error('未能识别到有效的学生信息。请确保：第一列是学号，第二列是姓名。');
        }

        console.log('准备提交的学生数据:', studentsToUpsert);

        const { error } = await supabase
          .from('students')
          .upsert(studentsToUpsert, { onConflict: 'student_id,room_id' });

        if (error) {
          console.error('Supabase Upsert Error:', error);
          throw new Error(`数据库保存失败: ${error.message}`);
        }

        // Record batch import in history
        const importEntry: Partial<HistoryEntry> = {
          room_id: roomId,
          student_id: 'BATCH_IMPORT',
          student_name: '批量导入',
          action: 'add',
          details: JSON.stringify({ count: studentsToUpsert.length }),
          timestamp: new Date().toISOString(),
          operator: operatorName
        };
        await supabase.from('history').insert(importEntry);
        
        console.log('Upsert successful, manually refreshing...');
        
        // 强制手动刷新一次，防止 Realtime 延迟或未开启
        const { data: freshData } = await supabase
          .from('students')
          .select('*')
          .eq('room_id', roomId)
          .order('student_id', { ascending: true });
        
        if (freshData) setStudents(freshData);
        
        alert(`✅ 成功导入 ${studentsToUpsert.length} 名学生！\n\n数据已同步并刷新。`);
      } catch (err: any) {
        console.error('详细导入错误:', err);
        alert('❌ 导入出错\n\n原因: ' + (err.message || '未知错误') + '\n\n建议：请确保文件是标准的 Excel (.xlsx, .xls) 或 CSV 格式。');
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      alert('❌ 文件读取出错，请检查文件是否被其他程序占用。');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  // --- UI Views ---
  if (!roomId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 p-10 border border-white/50 backdrop-blur-xl"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">课堂管理系统</h1>
            <p className="text-slate-400 text-center mt-3 font-medium">实时同步 · 云端管理 · 移动优先</p>
          </div>

          <div className="space-y-8">
            {recentRooms.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">最近访问</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {recentRooms.map(id => (
                    <button
                      key={id}
                      onClick={() => joinRoom(id)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors border border-indigo-100"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Button onClick={createRoom} className="w-full h-14 text-lg font-bold rounded-2xl" size="lg">
                创建新班级
              </Button>
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                  <span className="bg-white px-4 text-slate-300">OR</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative group">
                  <Input 
                    placeholder="输入 6 位房间号" 
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-14 text-center text-2xl tracking-[0.5em] font-black bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-medium"
                  />
                  {joinInput.length > 0 && (
                    <button 
                      onClick={() => setJoinInput('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <Button 
                  variant="secondary" 
                  className="w-full h-14 text-lg font-bold rounded-2xl border-2" 
                  onClick={() => joinRoom()}
                  disabled={joinInput.length !== 6}
                >
                  加入现有班级
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-50 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              云端同步已就绪
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              输入房间号即可在任何设备恢复数据
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-none">Room {roomId}</h2>
              <p className="text-[10px] text-slate-500 mt-1">在线同步中</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => {
                if (confirm('确定要退出当前房间吗？')) {
                  leaveRoom();
                }
              }} 
              className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
              title="退出房间"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 text-slate-400 md:hidden rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100">
          <Button 
            className="w-full justify-start gap-2" 
            variant="primary" 
            size="sm"
            onClick={() => {
              setIsAddModalOpen(true);
              setIsSidebarOpen(false);
            }}
          >
            <UserPlus className="w-4 h-4" />
            添加学生
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">班级列表</p>
          {classes.map(cls => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm group",
                selectedClass === cls 
                  ? "bg-indigo-50 text-indigo-700 font-medium" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className={cn("w-4 h-4", selectedClass === cls ? "text-indigo-600" : "text-slate-400")} />
                {cls === 'All' ? '所有学生' : cls}
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-bold",
                selectedClass === cls ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-500"
              )}>
                {cls === 'All' ? students.length : students.filter(s => s.class_name === cls).length}
              </span>
            </button>
          ))}

          <div className="mt-8">
            <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <History className="w-3 h-3" /> 操作历史
            </p>
            <div className="space-y-2 px-2 max-h-64 overflow-y-auto custom-scrollbar">
              {history.length === 0 ? (
                <p className="text-[10px] text-slate-400 text-center py-4 italic">暂无操作记录</p>
              ) : (
                <AnimatePresence initial={false}>
                  {history.map(entry => {
                    const isMe = entry.operator === operatorName;
                    const displayName = isMe ? '你' : (entry.operator || '未知');
                    
                    let actionText = '';
                    let scoreBadge = null;
                    
                    try {
                      const details = JSON.parse(entry.details);
                      if (entry.action === 'score_change') {
                        const delta = (details.newScore ?? 0) - (details.prevScore ?? 0);
                        const deltaText = delta > 0 ? `+${delta}` : `${delta}`;
                        actionText = `${entry.student_name} ${delta >= 0 ? '加' : '减'}${Math.abs(delta)}分`;
                        scoreBadge = (
                          <span className={cn(
                            "text-[8px] font-bold px-1 rounded",
                            delta >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {deltaText}
                          </span>
                        );
                      } else if (entry.action === 'add') {
                        if (entry.student_id === 'BATCH_IMPORT') {
                          actionText = `批量导入了 ${details.count} 名学生`;
                        } else {
                          actionText = `添加了 ${entry.student_name}`;
                        }
                      } else if (entry.action === 'delete') {
                        actionText = `删除了 ${entry.student_name}`;
                      } else if (entry.action === 'attendance_change') {
                        actionText = `修改了 ${entry.student_name} 出勤`;
                      }
                    } catch (e) {
                      actionText = entry.action === 'delete' ? '删除学生' : '分数变动';
                    }

                    return (
                      <motion.div 
                        key={entry.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-2 bg-white rounded-lg border border-slate-100 group relative shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-0.5">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span className={cn(
                              "text-[10px] font-bold truncate",
                              isMe ? "text-indigo-600" : "text-slate-700"
                            )}>
                              {displayName}
                            </span>
                            <span className="text-[9px] text-slate-500 flex-1 truncate">
                              {actionText}
                            </span>
                          </div>
                          <span className="text-[8px] text-slate-400 whitespace-nowrap ml-1">
                            {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            {scoreBadge}
                          </div>
                          <button 
                            onClick={() => undoHistory(entry)}
                            className="text-[9px] text-red-500 hover:text-red-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            撤销
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>总人数: {students.length}</span>
            <span>出勤: {students.filter(s => s.is_present).length}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 z-10">
          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 text-slate-600 md:hidden rounded-xl bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="搜索姓名或学号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === 'list' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Button 
              variant="primary" 
              size="sm" 
              className="gap-2 shrink-0 bg-purple-600 hover:bg-purple-700 border-none shadow-md shadow-purple-100 whitespace-nowrap" 
              onClick={() => {
                setHasDrawn(false);
                setDrawResults([]);
                setIsDrawModalOpen(true);
              }}
            >
              <Dices className="w-4 h-4" />
              随机抽人
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 shrink-0 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm whitespace-nowrap" 
              onClick={() => setIsBatchModalOpen(true)}
            >
              <Users className="w-4 h-4 text-indigo-500" />
              批量加分
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 shrink-0 whitespace-nowrap" 
              onClick={() => {
                if (roomId && supabase) {
                  setLoading(true);
                  supabase
                    .from('students')
                    .select('*')
                    .eq('room_id', roomId)
                    .order('student_id', { ascending: true })
                    .then(({ data, error }) => {
                      if (error) {
                        console.error('Manual refresh error:', error);
                        alert('❌ 刷新失败: ' + error.message);
                      } else {
                        setStudents(data || []);
                      }
                      setLoading(false);
                    });
                }
              }}
            >
              <RotateCcw className="w-4 h-4" />
              刷新
            </Button>

            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".xlsx, .xls, .csv, .txt, .ods" 
              onChange={handleImportExcel}
            />
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-2 shrink-0 whitespace-nowrap" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="w-4 h-4" />
              文件导入
            </Button>

            <Button variant="secondary" size="sm" onClick={exportToExcel} className="gap-2 shrink-0 whitespace-nowrap">
              <Download className="w-4 h-4" />
              导出
            </Button>
          </div>
        </header>

        {/* Grid/List Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10" />
              </div>
              <p>未找到符合条件的学生</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "group relative bg-white rounded-xl p-3 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all",
                      !student.is_present && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-inner",
                          student.is_present ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                        )}>
                          {student.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{student.name}</h3>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {getShortId(student.student_id)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingStudent(student);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => deleteStudent(student)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 rounded-lg p-1.5 mb-2">
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        <span className="text-sm font-black text-slate-900">{student.score}</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateScore(student, -1);
                          }}
                          className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
                        >
                          -1
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateScore(student, 1);
                          }}
                          className="w-6 h-6 flex items-center justify-center bg-indigo-600 rounded text-white hover:bg-indigo-700 transition-all active:scale-90"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleAttendance(student)}
                      className={cn(
                        "w-full py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5",
                        student.is_present 
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      {student.is_present ? (
                        <><UserCheck className="w-3 h-3" /> 出勤</>
                      ) : (
                        <><UserX className="w-3 h-3" /> 缺勤</>
                      )}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">学号</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">姓名</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">班级</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">分数</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">状态</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className={cn("hover:bg-slate-50/50 transition-colors", !student.is_present && "opacity-60")}>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">
                        <span className="text-indigo-600 font-bold">{getShortId(student.student_id)}</span>
                        <span className="opacity-30 text-[10px] ml-1">{student.student_id.length > 6 ? '...' + student.student_id.slice(-6, -3) : ''}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{student.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{student.class_name}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-3">
                          <button onClick={() => updateScore(student, -1)} className="text-slate-400 hover:text-red-500">-</button>
                          <span className="font-bold text-slate-900 min-w-[2ch]">{student.score}</span>
                          <button onClick={() => updateScore(student, 1)} className="text-slate-400 hover:text-indigo-600">+</button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleAttendance(student)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            student.is_present ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {student.is_present ? '出勤' : '缺勤'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingStudent(student);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteStudent(student)}
                            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="添加新学生">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">学号</label>
            <Input 
              placeholder="例如: 001" 
              value={newStudent.student_id}
              onChange={e => setNewStudent({...newStudent, student_id: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">姓名</label>
            <Input 
              placeholder="输入学生姓名" 
              value={newStudent.name}
              onChange={e => setNewStudent({...newStudent, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">班级</label>
            <Input 
              placeholder="例如: 高一(1)班" 
              value={newStudent.class_name}
              onChange={e => setNewStudent({...newStudent, class_name: e.target.value})}
            />
          </div>
          <Button 
            className="w-full mt-4" 
            onClick={async () => {
              if (!newStudent.student_id || !newStudent.name || !newStudent.class_name) return;
              await upsertStudent({
                ...newStudent,
                score: 0,
                is_present: true
              });
              setNewStudent({ student_id: '', name: '', class_name: '' });
              setIsAddModalOpen(false);
            }}
          >
            确认添加
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isDrawModalOpen} onClose={() => setIsDrawModalOpen(false)} title="随机抽人" maxWidth="max-w-2xl">
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-1 sm:mb-2">选择班级</label>
              <select 
                value={drawFilters.className}
                onChange={(e) => setDrawFilters({ ...drawFilters, className: e.target.value })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                {classes.map(c => <option key={c} value={c}>{c === 'All' ? '所有班级' : c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-1 sm:mb-2">抽取人数</label>
              <input 
                type="number"
                min="1"
                max="10"
                value={drawFilters.count || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setDrawFilters({ ...drawFilters, count: val });
                }}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div className="flex flex-col justify-end pb-1.5 sm:pb-2 col-span-2 sm:col-span-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={drawFilters.onlyZeroScore}
                  onChange={(e) => setDrawFilters({ ...drawFilters, onlyZeroScore: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">限定零分</span>
              </label>
            </div>
          </div>

          {(drawResults.length > 0 || isDrawing) && (
            <div className="relative min-h-[180px] sm:min-h-[200px] max-h-[300px] sm:max-h-[400px] overflow-y-auto p-3 sm:p-4 bg-slate-900 rounded-2xl sm:rounded-3xl border-4 border-slate-800 shadow-inner custom-scrollbar">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500 via-transparent to-transparent pointer-events-none" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                <AnimatePresence mode="popLayout">
                  {drawResults.map(student => (
                    <motion.div 
                      key={student.id}
                      initial={isDrawing ? { opacity: 0.8, scale: 0.95 } : { scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={isDrawing ? { duration: 0.05 } : { type: "spring", damping: 12, stiffness: 200 }}
                      className="bg-purple-600/20 border border-purple-500/30 rounded-2xl p-3 sm:p-4 text-center backdrop-blur-sm"
                    >
                      <div className="text-purple-400 text-[10px] font-mono mb-1">{student.class_name} · {getShortId(student.student_id)}</div>
                      <div className="text-lg sm:text-xl font-black text-white tracking-wider mb-2 sm:mb-3">{student.name}</div>
                      
                      <div className="flex items-center justify-center bg-black/20 rounded-xl p-2 mt-2">
                        <div className="relative">
                          <input 
                            type="number"
                            value={student.score}
                            onChange={(e) => setStudentScore(student, parseInt(e.target.value) || 0)}
                            className="w-20 pl-3 pr-8 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-black text-center focus:ring-2 focus:ring-purple-500/50 outline-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/40 font-bold pointer-events-none">分</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className={cn("flex gap-3", !hasDrawn && "flex-row-reverse")}>
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700 border-none text-base sm:text-lg font-bold shadow-xl shadow-purple-200" 
              onClick={pickRandomStudent}
              disabled={isDrawing}
            >
              {isDrawing ? '抽取中...' : (hasDrawn ? '再次抽取' : '开始抽取')}
            </Button>
            <Button 
              variant={hasDrawn ? "primary" : "secondary"}
              className={cn(
                "flex-1 text-base sm:text-lg font-bold",
                hasDrawn ? "bg-emerald-600 hover:bg-emerald-700 border-none shadow-xl shadow-emerald-200" : ""
              )} 
              onClick={() => setIsDrawModalOpen(false)}
            >
              {hasDrawn ? '太棒了！' : '关闭'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} title="批量加分" maxWidth="max-w-xl">
        <div className="space-y-6">
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">搜索学生 (姓名或学号末尾)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="输入姓名或学号..." 
                className="pl-10"
                value={batchSearchQuery}
                onChange={(e) => setBatchSearchQuery(e.target.value)}
              />
            </div>
            
            {batchSearchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                {batchSearchResults.map(student => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedBatchStudents([...selectedBatchStudents, student]);
                      setBatchSearchQuery('');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">{student.name}</div>
                      <div className="text-[10px] text-slate-400">{student.class_name} · {student.student_id}</div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">已选择 ({selectedBatchStudents.length})</label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-50 rounded-xl border border-slate-100">
              {selectedBatchStudents.length === 0 ? (
                <span className="text-xs text-slate-400 italic">尚未选择学生</span>
              ) : (
                selectedBatchStudents.map(student => (
                  <div key={student.id} className="flex items-center gap-1.5 bg-white border border-slate-200 pl-2 pr-1 py-1 rounded-lg shadow-sm animate-in fade-in zoom-in duration-200">
                    <span className="text-xs font-bold text-slate-700">{student.name}</span>
                    <button 
                      onClick={() => setSelectedBatchStudents(selectedBatchStudents.filter(s => s.id !== student.id))}
                      className="p-0.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <div className="flex-1">
              <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">统一加分值</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  value={batchScoreDelta}
                  onChange={(e) => setBatchScoreDelta(parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
                <div className="flex gap-1">
                  {[1, 2, 5, 10].map(val => (
                    <button
                      key={val}
                      onClick={() => setBatchScoreDelta(val)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                        batchScoreDelta === val ? "bg-indigo-600 text-white" : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50"
                      )}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setIsBatchModalOpen(false)}>取消</Button>
            <Button 
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 border-none shadow-lg shadow-indigo-200"
              disabled={selectedBatchStudents.length === 0 || loading}
              onClick={applyBatchScore}
            >
              {loading ? '处理中...' : `确认加分 (${selectedBatchStudents.length}人)`}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isOperatorModalOpen} 
        onClose={() => {}} // Prevent closing without input
        title="身份确认"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">请输入您的身份（如：课代表-小明）</p>
          <Input 
            placeholder="身份名称..." 
            value={tempOperatorName}
            onChange={(e) => setTempOperatorName(e.target.value)}
            autoFocus
          />
          <Button 
            className="w-full" 
            disabled={!tempOperatorName.trim()}
            onClick={() => {
              const name = tempOperatorName.trim();
              setOperatorName(name);
              localStorage.setItem('operator_name', name);
              setIsOperatorModalOpen(false);
            }}
          >
            确认进入
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="编辑学生信息">
        {editingStudent && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">学号 (不可修改)</label>
              <Input value={editingStudent.student_id} disabled className="bg-slate-50 text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">姓名</label>
              <Input 
                value={editingStudent.name}
                onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">班级</label>
              <Input 
                value={editingStudent.class_name}
                onChange={e => setEditingStudent({...editingStudent, class_name: e.target.value})}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setIsEditModalOpen(false)}>取消</Button>
              <Button className="flex-1" onClick={async () => {
                await upsertStudent(editingStudent);
                setIsEditModalOpen(false);
              }}>保存修改</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
