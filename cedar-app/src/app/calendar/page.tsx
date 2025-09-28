"use client";

import React, { useState, useEffect } from 'react';
import { TriadBackground } from '@/cedar/components/backgrounds/Background';
import { Calendar, ChevronLeft, ChevronRight, Activity, Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/app/FirebaseAuthProvider';

interface EngagementData {
  date: string;
  count: number;
}

interface CalendarProps {
  data: EngagementData[];
}

const CalendarHeatmap: React.FC<CalendarProps & { currentPeriod: number; setCurrentPeriod: (period: number) => void }> = ({ data, currentPeriod, setCurrentPeriod }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Get period description
  const getPeriodDescription = () => {
    if (currentPeriod === 0) return 'Current Period';
    if (currentPeriod > 0) return `Previous ${currentPeriod} Period${currentPeriod > 1 ? 's' : ''}`;
    return `Next ${Math.abs(currentPeriod)} Period${Math.abs(currentPeriod) > 1 ? 's' : ''}`;
  };

  // Create a map for quick lookup
  const dataMap = new Map(data.map(item => [item.date, item.count]));
  
  // Get the maximum count for color intensity
  const maxCount = Math.max(...data.map(item => item.count), 1);

  // Generate calendar data for the selected 6-month period (GitHub-style)
  const generateCalendarData = () => {
    const today = new Date();
    
    // Calculate FULL 6-month periods from the first day of the month
    // For current period (0): 6 full months ending today
    // For previous period (1): 6 full months ending 6 months ago
    // For previous period (2): 6 full months ending 12 months ago
    
    // Calculate the end of the period (today for current period, or 6 months ago for previous periods)
    const periodEnd = new Date(today);
    if (currentPeriod > 0) {
      periodEnd.setMonth(today.getMonth() - (6 * currentPeriod));
    }
    // For current period (0), use today as the end date
    // For other periods, use the calculated period end date
    
    // Debug: Log today's date
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
    console.log(`Today is: ${todayStr}`);
    
    // Calculate the start of the period (first day of the 6th month before periodEnd)
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodEnd.getMonth() - 6);
    periodStart.setDate(1); // First day of the month
    
    // Debug: Log the period dates
    const startYear = periodStart.getFullYear();
    const startMonth = String(periodStart.getMonth() + 1).padStart(2, '0');
    const startDay = String(periodStart.getDate()).padStart(2, '0');
    const startDateStr = `${startYear}-${startMonth}-${startDay}`;
    
    const endYear = periodEnd.getFullYear();
    const endMonth = String(periodEnd.getMonth() + 1).padStart(2, '0');
    const endDay = String(periodEnd.getDate()).padStart(2, '0');
    const endDateStr = `${endYear}-${endMonth}-${endDay}`;
    
    console.log(`Period ${currentPeriod}: ${startDateStr} to ${endDateStr}`);
    
    // Create a counts array for all dates in the period
    const dateCounts: { [date: string]: number } = {};
    
    // Generate all dates in the 6-month period
    let currentDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    // Always add 1 day to include the period end date in the loop
    // For current period (0), this includes today
    // For other periods, this includes the period end date
    endDate.setDate(periodEnd.getDate() + 1);
    
    while (currentDate < endDate) {
      // Use local date formatting to avoid timezone issues
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const count = dataMap.get(dateStr) || 0;
      dateCounts[dateStr] = count;
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }
    
    // Debug: Log the dateCounts array
    console.log('Date counts for period:', dateCounts);
    
    // Find the first Sunday of the 6-month period for calendar alignment
    const firstSunday = new Date(periodStart);
    firstSunday.setDate(periodStart.getDate() - periodStart.getDay());
    
    const calendarData: { date: string; count: number; dayOfWeek: number; isCurrentYear: boolean }[] = [];
    
    // Add days from first Sunday to period start (padding days)
    let date = new Date(firstSunday);
    while (date < periodStart) {
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      calendarData.push({
        date: dateStr,
        count: 0,
        dayOfWeek: date.getDay(),
        isCurrentYear: false
      });
      date = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    }
    
    // Add the selected 6 months (inclusive of both start and end dates)
    date = new Date(periodStart);
    while (date < endDate) {
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const count = dateCounts[dateStr] || 0;
      calendarData.push({
        date: dateStr,
        count,
        dayOfWeek: date.getDay(),
        isCurrentYear: true
      });
      date = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    }
    
    // Ensure we have a complete first week (7 days)
    if (calendarData.length > 0) {
      const firstDate = new Date(calendarData[0].date + 'T00:00:00');
      const firstDayOfWeek = firstDate.getDay();
      
      // If the first day is not Sunday (0), add missing days
      if (firstDayOfWeek !== 0) {
        const missingDays = firstDayOfWeek;
        for (let i = missingDays - 1; i >= 0; i--) {
          const prevDate = new Date(firstDate.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
          // Use local date formatting to avoid timezone issues
          const year = prevDate.getFullYear();
          const month = String(prevDate.getMonth() + 1).padStart(2, '0');
          const day = String(prevDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          calendarData.unshift({
            date: dateStr,
            count: 0,
            dayOfWeek: prevDate.getDay(),
            isCurrentYear: false
          });
        }
      }
    }
    
    return calendarData;
  };

  const calendarData = generateCalendarData();

  // Get color intensity based on user engagement count
  const getColorIntensity = (count: number, isCurrentYear: boolean) => {
    if (!isCurrentYear) return 'bg-gray-50';
    if (count === 0) return 'bg-gray-100';
    if (count <= 1) return 'bg-green-200';
    if (count <= 2) return 'bg-green-300';
    if (count <= 3) return 'bg-green-400';
    if (count <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  // Get week labels
  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group data by weeks (53 weeks to cover the year)
  const weeks: { date: string; count: number; dayOfWeek: number; isCurrentYear: boolean }[][] = [];
  let currentWeek: { date: string; count: number; dayOfWeek: number; isCurrentYear: boolean }[] = [];
  
  calendarData.forEach((item, index) => {
    if (item.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
    currentWeek.push(item);
  });
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Generate month labels for the top of the calendar
  const generateMonthLabels = () => {
    const monthLabels: { month: string; weekIndex: number; width: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create a map of week index to month for active days
    const weekToMonth = new Map<number, number>();
    
    weeks.forEach((week, weekIndex) => {
      const activeDay = week.find(day => day.isCurrentYear);
      if (activeDay) {
        const date = new Date(activeDay.date);
        const month = date.getMonth();
        weekToMonth.set(weekIndex, month);
      }
    });
    
    // Find the first month and skip it
    let firstMonth = -1;
    let firstMonthEndWeek = -1;
    
    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
      const month = weekToMonth.get(weekIndex);
      if (month !== undefined) {
        if (firstMonth === -1) {
          firstMonth = month;
        } else if (month !== firstMonth) {
          firstMonthEndWeek = weekIndex;
          break;
        }
      }
    }
    
    // Group consecutive weeks by month, starting from the second month
    let currentMonth = -1;
    let monthStartWeek = 0;
    let foundSecondMonth = false;
    
    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
      const month = weekToMonth.get(weekIndex);
      
      if (month !== undefined) {
        // Skip the first month
        if (!foundSecondMonth && month === firstMonth) {
          continue;
        }
        
        if (!foundSecondMonth) {
          foundSecondMonth = true;
          currentMonth = month;
          monthStartWeek = weekIndex;
        } else if (month !== currentMonth) {
          // If we had a previous month, add it to labels
          if (currentMonth !== -1) {
            monthLabels.push({
              month: monthNames[currentMonth],
              weekIndex: monthStartWeek,
              width: weekIndex - monthStartWeek
            });
          }
          
          currentMonth = month;
          monthStartWeek = weekIndex;
        }
      }
    }
    
    // Add the last month
    if (currentMonth !== -1) {
      monthLabels.push({
        month: monthNames[currentMonth],
        weekIndex: monthStartWeek,
        width: weeks.length - monthStartWeek
      });
    }
    
    return monthLabels;
  };

  const monthLabels = generateMonthLabels();

  // Filter out the first month's weeks
  // Corrected Code

  const firstWeekWithActiveDays = weeks.find(week => week.some(day => day.isCurrentYear));
  const firstActiveDay = firstWeekWithActiveDays?.find(day => day.isCurrentYear);
  const firstMonthValue = firstActiveDay ? new Date(firstActiveDay.date).getMonth() : -1;

  const filteredWeeks = weeks.filter(week => {
    const activeDay = week.find(day => day.isCurrentYear);
    if (activeDay) {
      const month = new Date(activeDay.date).getMonth();
      return month !== firstMonthValue;
    }
    return true; // Keep weeks without active days
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-6 flex flex-col items-center">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white">User Engagement Calendar</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPeriod(currentPeriod + 1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Previous 6 months"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-xl font-semibold text-white">
              {getPeriodDescription()}
            </span>
            {currentPeriod !== 0 && (
              <button
                onClick={() => setCurrentPeriod(0)}
                className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Go to current period"
              >
                Go to current period
              </button>
            )}
            <button
              onClick={() => setCurrentPeriod(currentPeriod - 1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Next 6 months"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-white/80">Less</span>
            <div className="flex gap-1">
              {[0, 1, 5, 10, 20].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${getColorIntensity(level, true)}`}
                />
              ))}
            </div>
            <span className="text-sm text-white/80">More</span>
          </div>
        </div>

        <div className="overflow-x-auto flex justify-center">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-8"></th>
                {monthLabels.map((monthLabel, index) => (
                  <th
                    key={index}
                    className="text-xs text-white/80 text-center font-medium px-2"
                    colSpan={monthLabel.width}
                    style={{ 
                      minWidth: `${monthLabel.width * 16}px`,
                      paddingRight: index < monthLabels.length - 1 ? '16px' : '0px'
                    }}
                  >
                    {monthLabel.month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekLabels.map((label, dayIndex) => (
                <tr key={dayIndex}>
                  <td className="text-xs text-white/60 text-center py-1 w-8">
                    {dayIndex % 2 === 0 ? label : ''}
                  </td>
                  {filteredWeeks.map((week, weekIndex) => {
                    const day = week[dayIndex];
                    if (!day) return <td key={weekIndex} className="w-4 h-4 p-0"></td>;
                    
                    return (
                      <td key={weekIndex} className="p-0 w-4">
                        <div
                          className={`w-4 h-4 rounded-sm cursor-pointer transition-all hover:scale-110 ${getColorIntensity(day.count, day.isCurrentYear)}`}
                          onMouseEnter={() => setHoveredDate(day.date)}
                          onMouseLeave={() => setHoveredDate(null)}
                          title={`${day.date}: ${day.count} notes`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hoveredDate && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
            <div className="text-sm text-white">
              <strong>{new Date(hoveredDate + 'T00:00:00').toLocaleDateString()}</strong>
              <br />
              {dataMap.get(hoveredDate) || 0} notes
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-6 flex items-center justify-center gap-8 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Total notes: {data.reduce((sum, item) => sum + item.count, 0)}</span>
          </div>
          <div>
            Current streak: {getCurrentStreak(data)} days
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate current streak
const getCurrentStreak = (data: EngagementData[]): number => {
  const today = new Date();
  let streak = 0;
  
  // Check back to 6 months ago
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  for (let date = new Date(today); date >= sixMonthsAgo; date.setDate(date.getDate() - 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = data.find(item => item.date === dateStr);
    
    if (dayData && dayData.count > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(0); // 0 = current, -1 = previous, 1 = next
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchEngagementData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/conversations/calendar?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setEngagementData(data);
        } else {
          // If no data, create some sample data for demonstration
          setEngagementData(generateSampleData());
        }
      } catch (error) {
        console.error('Error fetching engagement data:', error);
        // Fallback to sample data
        setEngagementData(generateSampleData());
      } finally {
        setLoading(false);
      }
    };

    fetchEngagementData();
  }, [user]);

  const generateSampleData = (): EngagementData[] => {
    const data: EngagementData[] = [];
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 1); // Include today
    
    // Generate data for the past 6 months
    let date = new Date(sixMonthsAgo);
    while (date < endDate) {
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Random user input count (0-25) with some patterns
      const random = Math.random();
      let count = 0;
      
      if (random > 0.4) { // 60% chance of having user inputs
        count = Math.floor(Math.random() * 25) + 1;
      }
      
      if (count > 0) {
        data.push({ date: dateStr, count });
      }
      
      date = new Date(date.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
    }
    
    return data;
  };

  if (loading) {
    return (
      <TriadBackground className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading calendar...</div>
      </TriadBackground>
    );
  }

  return (
    <TriadBackground className="min-h-screen">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        currentPage="calendar" 
      />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <CalendarHeatmap data={engagementData} currentPeriod={currentPeriod} setCurrentPeriod={setCurrentPeriod} />
      </div>
    </TriadBackground>
  );
}
