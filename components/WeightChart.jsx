'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { it } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

export default function WeightChart({ datiPeso }) {
  if (!datiPeso || datiPeso.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-lg">Nessun dato disponibile per il grafico</p>
        <p className="text-sm mt-2">Aggiungi almeno una misurazione per visualizzare l'andamento</p>
      </div>
    );
  }

  const datiGrafico = {
    labels: datiPeso.map(misurazione => new Date(misurazione.data_misurazione)),
    datasets: [{
      label: 'Peso Corporeo (kg)',
      data: datiPeso.map(misurazione => parseFloat(misurazione.valore_peso)),
      borderColor: '#dc2626',
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointRadius: 6,
      pointHoverRadius: 10,
      pointBackgroundColor: '#dc2626',
      pointBorderColor: '#fff',
      pointBorderWidth: 3,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#dc2626',
      pointHoverBorderWidth: 3,
    }]
  };

  const opzioniGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: '#dc2626',
        borderWidth: 2,
        padding: 16,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 16,
          weight: 'bold',
        },
        callbacks: {
          title: (context) => {
            const data = new Date(context[0].parsed.x);
            return data.toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          },
          label: (context) => `${context.parsed.y} kg`
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'dd/MM/yyyy',
          displayFormats: {
            day: 'dd/MM',
            week: 'dd/MM',
            month: 'MMM yyyy'
          }
        },
        adapters: {
          date: {
            locale: it
          }
        },
        grid: {
          color: '#27272a',
          drawBorder: false,
        },
        ticks: {
          color: '#71717a',
          font: {
            weight: 'bold',
            size: 12
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        title: {
          display: true,
          text: 'PESO (KG)',
          color: '#dc2626',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: '#27272a',
          drawBorder: false,
        },
        ticks: {
          color: '#71717a',
          font: {
            weight: 'bold',
            size: 12
          },
          callback: function(value) {
            return value + ' kg';
          }
        }
      }
    }
  };

  return (
    <div className="h-[400px] w-full">
      <Line data={datiGrafico} options={opzioniGrafico} />
    </div>
  );
}
