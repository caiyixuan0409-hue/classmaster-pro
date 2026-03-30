/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { 
  GraduationCap, 
  FileUp, 
  TableProperties, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Dices 
} from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/20">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-surface/70 backdrop-blur-md border-b border-on-surface/5 px-6 py-4 flex justify-between items-center">
        <div className="font-headline font-bold text-xl text-primary tracking-tight">
          ClassMaster Pro
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-primary font-headline font-semibold border-b-2 border-primary px-1 py-1 transition-all">
            班级概览
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-on-surface-variant hover:bg-primary/5 transition-colors px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 duration-200">
            重置系统
          </button>
          <button className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold active:scale-95 duration-200 shadow-sm hover:shadow-md transition-all">
            导出报表
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow relative flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-secondary-container/20 rounded-full blur-[100px] -z-10" />

        <div className="max-w-4xl w-full text-center space-y-12 z-10">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-white shadow-xl mb-4 transform -rotate-6">
              <GraduationCap className="text-primary w-12 h-12" />
            </div>
            
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">
                规划您的课堂
              </span>
            </h1>
            
            <p className="max-w-xl mx-auto text-on-surface-variant text-lg leading-relaxed font-medium">
              欢迎使用 ClassMaster Pro。开始建立您的数字名册。一旦您的学生名单整合完毕，您的学术仪表盘将立即呈现。
            </p>
          </motion.div>

          {/* Central Action Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="p-8 md:p-12 bg-surface-container rounded-[2.5rem] w-full max-w-2xl shadow-sm border border-on-surface/5 relative group overflow-hidden">
              {/* Subtle Hover Glow */}
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <FileUp className="text-primary w-8 h-8" />
                  </div>
                  <h2 className="font-headline text-2xl font-bold text-on-surface">从学生数据开始</h2>
                  <p className="text-on-surface-variant text-sm mt-2 font-semibold tracking-wide uppercase opacity-70">
                    支持格式：.xlsx, .csv
                  </p>
                </div>

                <button className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-headline text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 mx-auto">
                  <TableProperties className="w-6 h-6" />
                  导入名单
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em]">
                    <CheckCircle2 className="w-4 h-4" />
                    自动同步
                  </div>
                  <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em]">
                    <ShieldCheck className="w-4 h-4" />
                    数据安全
                  </div>
                  <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em]">
                    <Zap className="w-4 h-4" />
                    即时预览
                  </div>
                </div>
              </div>
            </div>

            {/* Narrative Quote */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="max-w-md bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-on-surface/5"
            >
              <p className="text-sm italic text-on-surface-variant leading-relaxed font-medium">
                "ClassMaster Pro 的目标是减轻认知负担。通过导入您的名册，系统会自动配置座位表、出勤日志和性能指标，并根据您的具体小组规模进行量身定制。"
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Floating Image (Left) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2 w-64 h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white animate-float"
        >
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAWD8kVOaQqsQsdDF-dgZxKjnm4_Etaz88atfWU4EV4wNpVbaLv6rATGtt7v-EBw0Yv0RBAtSdda--uFNbp66updEDl2yevxRf30MwZ5PWkbvqE90P2AMrHGp93HOE65F1jdmuf3tm67K1TMVT8diaiCcjZyY5gMoVxvyx5uGiO2syQW6jTmswCr-ngjsUdAp-a_eRs9lZ9AZkzEkypz_bS9Ji2m7yQPpseJoRzt6dG4Hh8HWIIy1Bpzio5ka5atDZxns5XwJTXoo" 
            alt="Classroom" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase">和谐课堂</span>
          </div>
        </motion.div>

        {/* Decorative Floating Card (Right) */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="hidden lg:block absolute right-12 bottom-20 w-72 h-48 bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 animate-float-reverse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary-container" />
            <div className="space-y-1">
              <div className="w-24 h-2 bg-on-surface-variant/20 rounded" />
              <div className="w-16 h-2 bg-on-surface-variant/10 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-2 bg-on-surface-variant/5 rounded" />
            <div className="w-full h-2 bg-on-surface-variant/5 rounded" />
            <div className="w-3/4 h-2 bg-on-surface-variant/5 rounded" />
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div className="w-12 h-4 bg-primary/20 rounded-full" />
            <div className="w-4 h-4 rounded-full bg-primary/40" />
          </div>
        </motion.div>
      </main>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-md border-t border-on-surface/5 z-50">
        <button className="w-full flex items-center justify-center bg-primary text-white rounded-xl px-8 py-4 shadow-lg shadow-primary/20 active:scale-95 transition-all font-headline font-bold uppercase tracking-widest text-sm">
          <Dices className="w-5 h-5 mr-3" />
          随机抽取
        </button>
      </div>
    </div>
  );
}
