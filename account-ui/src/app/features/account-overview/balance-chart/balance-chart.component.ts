import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { Transaction } from '../../../core/models';

@Component({
  selector: 'app-balance-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsDirective, NzCardModule, NzEmptyModule, NzDatePickerModule],
  templateUrl: './balance-chart.component.html',
})
export class BalanceChartComponent implements OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() currency = '';

  selectedDate: Date = new Date();
  chartOption: EChartsOption = {};
  chartWidth = 600;
  hasData = false;

  ngOnChanges(): void {
    this.buildChart();
  }

  onDateChange(date: Date | null): void {
    if (date) {
      this.selectedDate = date;
      this.buildChart();
    }
  }

  private buildChart(): void {
    const d = this.selectedDate;
    const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const to   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    const points = [...this.transactions]
      .filter((t) => { const ts = new Date(t.createdAt); return ts >= from && ts <= to; })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    this.hasData = points.length > 0;
    if (!this.hasData) { this.chartOption = {}; return; }

    // Each transaction gets its own slot — at least 50px wide so labels never overlap
    this.chartWidth = Math.max(600, points.length * 50);

    const labels = points.map((t) =>
      new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    );
    const balances = points.map((t) => Number(t.balanceAfter));

    this.chartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `${p.name}<br/><b>${Number(p.value).toFixed(2)} ${this.currency}</b>`;
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: points.length > 8 ? 45 : 0, fontSize: 11 },
        boundaryGap: true,
      },
      yAxis: {
        type: 'value',
        name: this.currency,
        nameLocation: 'end',
        axisLabel: { formatter: (v: number) => v.toFixed(2) },
      },
      series: [{
        type: 'line',
        name: 'Balance',
        data: balances,
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: '#1890ff' },
        itemStyle: { color: '#1890ff', borderWidth: 2, borderColor: '#fff' },
        areaStyle: { color: '#1890ff', opacity: 0.08 },
      }],
      grid: { left: '14%', right: '6%', bottom: points.length > 8 ? '20%' : '14%', top: '16%' },
    };
  }
}

