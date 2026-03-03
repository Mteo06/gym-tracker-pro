'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X, Play, Pause, RotateCcw } from 'lucide-react';

export default function RestTimer({ initialSeconds = 90, udi }) {
    const [tempoResiduo, setTempoResiduo] = useState(initialSeconds);
    const [inPausa, setInPausa] = useState(false);
    const [aperto, setAperto] = useState(true);

    useEffect(() => {
        let interval;
        if (!inPausa && tempoResiduo > 0 && aperto) {
            interval = setInterval(() => {
                setTempoResiduo(prev => prev - 1);
            }, 1000);
        } else if (tempoResiduo === 0) {
            clearInterval(interval);
            // Optional sound or vibration could be added here
        }
        return () => clearInterval(interval);
    }, [tempoResiduo, inPausa, aperto]);

    const resettaTimer = () => {
        setTempoResiduo(initialSeconds);
        setInPausa(false);
    };

    const formattaTempo = (secondi) => {
        const min = Math.floor(secondi / 60);
        const sec = secondi % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const progress = (tempoResiduo / initialSeconds) * 100;
    const isFinished = tempoResiduo === 0;

    if (!aperto) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 w-72"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-zinc-400">
                        <Timer className="w-5 h-5 text-gym-red" />
                        <span className="text-sm font-bold uppercase tracking-wider">Recupero</span>
                    </div>
                    <button
                        onClick={() => {
                            setAperto(false);
                            if (chiudi) chiudi();
                        }}
                        className="text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                    {/* Circular Progress */}
                    <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="60"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-zinc-800"
                            />
                            <motion.circle
                                cx="64"
                                cy="64"
                                r="60"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray="377"
                                strokeDashoffset={377 - (377 * progress) / 100}
                                className={isFinished ? "text-green-500 transition-colors duration-500" : "text-gym-red"}
                                style={{ strokeLinecap: 'round' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-black ${isFinished ? 'text-green-500 animate-pulse' : 'text-white'}`}>
                                {formattaTempo(tempoResiduo)}
                            </span>
                        </div>
                    </div>

                    <div className="flex space-x-3 w-full justify-center">
                        <button
                            onClick={() => setInPausa(!inPausa)}
                            disabled={isFinished}
                            className={`p-3 rounded-full flex items-center justify-center transition-all flex-1 ${isFinished ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' :
                                inPausa ? 'bg-gym-red text-white hover:bg-gym-red-light' : 'bg-zinc-700 text-white hover:bg-zinc-600'
                                }`}
                        >
                            {inPausa ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={resettaTimer}
                            className="p-3 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-all flex items-center justify-center flex-1"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
