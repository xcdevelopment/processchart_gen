// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Chart.jsの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// ダッシュボードコンポーネント
const Dashboard = ({ workloadData }) => {
  const [topTimeConsumingSteps, setTopTimeConsumingSteps] = useState([]);
  const [categoryData, setCategoryData] = useState({ labels: [], datasets: [] });
  const [stepBarData, setStepBarData] = useState({ labels: [], datasets: [] });
  
  useEffect(() => {
    if (workloadData && workloadData.stepDetails) {
      // 所要時間順にステップをソート
      const sortedSteps = [...workloadData.stepDetails].sort((a, b) => b.annualHours - a.annualHours);
      setTopTimeConsumingSteps(sortedSteps.slice(0, 5)); // 上位5件
      
      // カテゴリ（工程タイプ）別チャートデータの準備
      const categories = Object.entries(workloadData.categorySummary).map(([category, hours]) => ({
        category: getCategoryLabel(category),
        hours
      }));
      
      setCategoryData({
        labels: categories.map(item => item.category),
        datasets: [
          {
            label: '年間工数（時間）',
            data: categories.map(item => item.hours),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          }
        ]
      });
      
      // ステップ別の棒グラフデータ準備（上位10件）
      const topSteps = sortedSteps.slice(0, 10);
      setStepBarData({
        labels: topSteps.map(step => step.label),
        datasets: [
          {
            label: '年間工数（時間）',
            data: topSteps.map(step => step.annualHours),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          }
        ]
      });
    }
  }, [workloadData]);
  
  // カテゴリラベルの変換
  const getCategoryLabel = (category) => {
    const labels = {
      'process': '加工',
      'inspection': '検査',
      'transport': '搬送',
      'delay': '停滞',
      'storage': '保管'
    };
    return labels[category] || category;
  };
  
  // カテゴリアイコンの取得
  const getCategoryIcon = (category) => {
    const icons = {
      'process': '⚙️',
      'inspection': '🔍',
      'transport': '🔄',
      'delay': '⏳',
      'storage': '📦'
    };
    return icons[category] || '📋';
  };
  
  // 表示がない場合
  if (!workloadData || !workloadData.stepDetails || workloadData.stepDetails.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2">
            業務時間分析ダッシュボード
          </Typography>
          <Typography color="textSecondary">
            プロセスチャートのデータがありません。チャートを作成してください。
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        業務時間分析ダッシュボード
      </Typography>
      
      <Grid container spacing={3}>
        {/* サマリーカード */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                年間総工数
              </Typography>
              <Typography variant="h3" component="div" color="primary">
                {workloadData.totalDays.toLocaleString()} 人日
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                {workloadData.totalHours.toLocaleString()} 時間
              </Typography>
              <Divider style={{ margin: '10px 0' }} />
              <Typography variant="subtitle2">
                総ステップ数: {workloadData.stepDetails.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* カテゴリ別工数カード */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                カテゴリ別工数
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <div style={{ height: '200px' }}>
                    <Pie 
                      data={categoryData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>カテゴリ</TableCell>
                          <TableCell align="right">時間</TableCell>
                          <TableCell align="right">割合</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(workloadData.categorySummary).map(([category, hours]) => (
                          <TableRow key={category}>
                            <TableCell>
                              {getCategoryIcon(category)} {getCategoryLabel(category)}
                            </TableCell>
                            <TableCell align="right">{hours.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              {Math.round((hours / workloadData.totalHours) * 100)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 工数の多いステップ */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                工数の多い業務ステップ（上位10件）
              </Typography>
              <div style={{ height: '300px' }}>
                <Bar 
                  data={stepBarData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '時間'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 詳細テーブル */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                工数の多いステップ詳細（上位5件）
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ステップ名</TableCell>
                      <TableCell>タイプ</TableCell>
                      <TableCell align="right">1回あたり（分）</TableCell>
                      <TableCell align="right">年間回数</TableCell>
                      <TableCell align="right">年間時間</TableCell>
                      <TableCell>比率</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topTimeConsumingSteps.map((step) => (
                      <TableRow key={step.id}>
                        <TableCell>{step.label}</TableCell>
                        <TableCell>
                          {getCategoryIcon(step.type)} {getCategoryLabel(step.type)}
                        </TableCell>
                        <TableCell align="right">{step.minutesPerOccurrence}</TableCell>
                        <TableCell align="right">{step.occurrencesPerYear.toLocaleString()}</TableCell>
                        <TableCell align="right">{step.annualHours.toLocaleString()}</TableCell>
                        <TableCell>
                          <LinearProgress 
                            variant="determinate" 
                            value={(step.annualHours / workloadData.totalHours) * 100} 
                            style={{ height: 10, borderRadius: 5 }}
                          />
                          {Math.round((step.annualHours / workloadData.totalHours) * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;