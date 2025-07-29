// Global variables
let isRealtime = true;
const table = "sensors_data";
let realtimeInterval;
let currentTable = "fm1";
let currentChart = "flowrate";
let sensorData = {
  fm1_flow_rate: [],
  fm2_flow_rate: [],
  fm1_volume: [],
  fm2_volume: [],
  friction_head_loss: [],
  minor_head_loss: [],
  total_head_loss: [],
};
let chart = null;

// Canvas Chart Class
class FlowMeterChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      // Create canvas if it doesn't exist
      this.canvas = document.createElement('canvas');
      this.canvas.id = canvasId;
      this.canvas.width = 800;
      this.canvas.height = 400;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '300px';
      
      // Find chart wrapper and append canvas
      const chartWrapper = document.querySelector('.chart-wrapper');
      if (chartWrapper) {
        chartWrapper.innerHTML = '';
        chartWrapper.appendChild(this.canvas);
      }
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.padding = 50;
    this.colors = {
      fm1_flow_rate: '#3182ce',
      fm2_flow_rate: '#e53e3e',
      fm1_volume: '#38a169',
      fm2_volume: '#d69e2e',
      friction_head_loss: '#805ad5',
      minor_head_loss: '#dd6b20',
      total_head_loss: '#c53030'
    };
    this.data = {};
    this.currentChart = 'flowrate';
    
    // Set up high DPI support
    this.setupHighDPI();
  }

  setupHighDPI() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.width = rect.width;
    this.height = rect.height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawGrid() {
    this.ctx.strokeStyle = '#e9ecef';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = this.padding + (i * (this.height - 2 * this.padding)) / 5;
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding, y);
      this.ctx.lineTo(this.width - this.padding, y);
      this.ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = this.padding + (i * (this.width - 2 * this.padding)) / 6;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.padding);
      this.ctx.lineTo(x, this.height - this.padding);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]);
  }

  drawAxes() {
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 2;

    // Y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding, this.padding);
    this.ctx.lineTo(this.padding, this.height - this.padding);
    this.ctx.stroke();

    // X-axis
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding, this.height - this.padding);
    this.ctx.lineTo(this.width - this.padding, this.height - this.padding);
    this.ctx.stroke();
  }

  drawLabels() {
    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    // Get max value based on current chart type
    let maxValue = this.getMaxValue();
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (i * maxValue / 5);
      const y = this.padding + (i * (this.height - 2 * this.padding)) / 5;
      this.ctx.fillText(value.toFixed(2), this.padding - 10, y);
    }

    // X-axis labels (time)
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    const timeLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
    for (let i = 0; i < timeLabels.length; i++) {
      const x = this.padding + (i * (this.width - 2 * this.padding)) / 6;
      this.ctx.fillText(timeLabels[i], x, this.height - this.padding + 10);
    }
  }

  getMaxValue() {
    let maxValue = 0;
    
    if (this.currentChart === 'flowrate') {
      const fm1Max = Math.max(...(this.data.fm1_flow_rate || []).map(d => d.value));
      const fm2Max = Math.max(...(this.data.fm2_flow_rate || []).map(d => d.value));
      maxValue = Math.max(fm1Max, fm2Max, 10);
    } else if (this.currentChart === 'volume') {
      const fm1Max = Math.max(...(this.data.fm1_volume || []).map(d => d.value));
      const fm2Max = Math.max(...(this.data.fm2_volume || []).map(d => d.value));
      maxValue = Math.max(fm1Max, fm2Max, 1000);
    } else if (this.currentChart === 'headloss') {
      const frictionMax = Math.max(...(this.data.friction_head_loss || []).map(d => d.value));
      const minorMax = Math.max(...(this.data.minor_head_loss || []).map(d => d.value));
      const totalMax = Math.max(...(this.data.total_head_loss || []).map(d => d.value));
      maxValue = Math.max(frictionMax, minorMax, totalMax, 10);
    }
    
    return maxValue || 100;
  }

  drawLine(data, color) {
    if (!data || data.length < 2) return;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const chartWidth = this.width - 2 * this.padding;
    const chartHeight = this.height - 2 * this.padding;
    const maxValue = this.getMaxValue();

    this.ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = this.padding + (index / (data.length - 1)) * chartWidth;
      let y = this.height - this.padding - (point.value / maxValue) * chartHeight;
      
      // Clamp y values to chart bounds
      y = Math.max(this.padding, Math.min(this.height - this.padding, y));
      
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    
    this.ctx.stroke();

    // Draw points
    this.ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = this.padding + (index / (data.length - 1)) * chartWidth;
      let y = this.height - this.padding - (point.value / maxValue) * chartHeight;
      y = Math.max(this.padding, Math.min(this.height - this.padding, y));
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
      this.ctx.fill();
      
      // Add white border to points
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3;
    });
  }

  drawLegend() {
    let legendItems = [];
    
    if (this.currentChart === 'flowrate') {
      legendItems = [
        { key: 'fm1_flow_rate', label: 'FM1 Flow Rate' },
        { key: 'fm2_flow_rate', label: 'FM2 Flow Rate' }
      ];
    } else if (this.currentChart === 'volume') {
      legendItems = [
        { key: 'fm1_volume', label: 'FM1 Volume' },
        { key: 'fm2_volume', label: 'FM2 Volume' }
      ];
    } else if (this.currentChart === 'headloss') {
      legendItems = [
        { key: 'friction_head_loss', label: 'Friction Head Loss' },
        { key: 'minor_head_loss', label: 'Minor Head Loss' },
        { key: 'total_head_loss', label: 'Total Head Loss' }
      ];
    }
    
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    legendItems.forEach((item, index) => {
      if (this.data[item.key] && this.data[item.key].length > 0) {
        const x = this.width - 180;
        const y = 20 + (index * 20);
        
        // Draw color box
        this.ctx.fillStyle = this.colors[item.key];
        this.ctx.fillRect(x, y - 6, 12, 12);
        
        // Draw label
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(item.label, x + 18, y);
      }
    });
  }

  updateData(data) {
    this.data = data;
  }

  setChart(chartType) {
    this.currentChart = chartType;
  }

  render() {
    this.clear();
    this.drawGrid();
    this.drawAxes();
    this.drawLabels();
    
    if (this.currentChart === 'flowrate') {
      if (this.data.fm1_flow_rate && this.data.fm1_flow_rate.length > 0) {
        this.drawLine(this.data.fm1_flow_rate, this.colors.fm1_flow_rate);
      }
      if (this.data.fm2_flow_rate && this.data.fm2_flow_rate.length > 0) {
        this.drawLine(this.data.fm2_flow_rate, this.colors.fm2_flow_rate);
      }
    } else if (this.currentChart === 'volume') {
      if (this.data.fm1_volume && this.data.fm1_volume.length > 0) {
        this.drawLine(this.data.fm1_volume, this.colors.fm1_volume);
      }
      if (this.data.fm2_volume && this.data.fm2_volume.length > 0) {
        this.drawLine(this.data.fm2_volume, this.colors.fm2_volume);
      }
    } else if (this.currentChart === 'headloss') {
      if (this.data.friction_head_loss && this.data.friction_head_loss.length > 0) {
        this.drawLine(this.data.friction_head_loss, this.colors.friction_head_loss);
      }
      if (this.data.minor_head_loss && this.data.minor_head_loss.length > 0) {
        this.drawLine(this.data.minor_head_loss, this.colors.minor_head_loss);
      }
      if (this.data.total_head_loss && this.data.total_head_loss.length > 0) {
        this.drawLine(this.data.total_head_loss, this.colors.total_head_loss);
      }
    }
    
    this.drawLegend();
  }
}

// Database communication functions
async function fetchSensorData(limit = 10) {
  try {
    const result = await window.api.invoke(
      "get-data-by-filters",
      table,
      {},
      {
        limit: limit,
        orderBy: "id DESC",
      }
    );

    if (result.success) {
      return result.data;
    } else {
      console.error("Failed to fetch sensor data:", result.error);
      return [];
    }
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    return [];
  }
}

async function fetchAllSensorData() {
  try {
    const result = await window.api.invoke(
      "get-data-by-filters",
      table,
      {},
      {
        orderBy: "id DESC",
        limit: 15,
      }
    );

    if (result.success) {
      return result.data;
    } else {
      console.error("Failed to fetch all sensor data:", result.error);
      return [];
    }
  } catch (error) {
    console.error("Error fetching all sensor data:", error);
    return [];
  }
}

// Insert new data to database
async function insertSensorData(data) {
  try {
    const formattedData = {
      user_id: 1, // Default user ID
      device_id: 1, // Default device ID
      fm1_pulse_count: data.fm1_pulse_count ? String(data.fm1_pulse_count) : null,
      fm1_flow_rate_lpm: data.fm1_flow_rate_lpm ? String(data.fm1_flow_rate_lpm) : null,
      fm1_velocity_ms: data.fm1_velocity_ms ? String(data.fm1_velocity_ms) : null,
      fm1_volume_interval_ml: data.fm1_volume_interval_ml ? String(data.fm1_volume_interval_ml) : null,
      fm1_total_volume_ml: data.fm1_total_volume_ml ? String(data.fm1_total_volume_ml) : null,
      fm1_total_volume_l: data.fm1_total_volume_l ? String(data.fm1_total_volume_l) : null,
      fm2_pulse_count: data.fm2_pulse_count ? String(data.fm2_pulse_count) : null,
      fm2_flow_rate_lpm: data.fm2_flow_rate_lpm ? String(data.fm2_flow_rate_lpm) : null,
      fm2_velocity_ms: data.fm2_velocity_ms ? String(data.fm2_velocity_ms) : null,
      fm2_volume_interval_ml: data.fm2_volume_interval_ml ? String(data.fm2_volume_interval_ml) : null,
      fm2_total_volume_ml: data.fm2_total_volume_ml ? String(data.fm2_total_volume_ml) : null,
      fm2_total_volume_l: data.fm2_total_volume_l ? String(data.fm2_total_volume_l) : null,
      avg_flow_rate_lpm: data.avg_flow_rate_lpm ? String(data.avg_flow_rate_lpm) : null,
      avg_velocity_ms: data.avg_velocity_ms ? String(data.avg_velocity_ms) : null,
      reynolds_number: data.reynolds_number ? String(data.reynolds_number) : null,
      friction_factor: data.friction_factor ? String(data.friction_factor) : null,
      friction_head_loss_mm: data.friction_head_loss_mm ? String(data.friction_head_loss_mm) : null,
      minor_head_loss_mm: data.minor_head_loss_mm ? String(data.minor_head_loss_mm) : null,
      total_head_loss_mm: data.total_head_loss_mm ? String(data.total_head_loss_mm) : null,
      leak_status: data.leak_status ? String(data.leak_status) : null,
      flow_difference_lpm: data.flow_difference_lpm ? String(data.flow_difference_lpm) : null,
      reading_timestamp: data.reading_timestamp || new Date().toISOString(),
    };

    const result = await window.api.invoke(
      "insert-data",
      table,
      formattedData
    );

    if (result.success) {
      console.log("Data inserted successfully:", result);
      return result;
    } else {
      console.error("Failed to insert sensor data:", result.error);
      return null;
    }
  } catch (error) {
    console.error("Error inserting sensor data:", error);
    return null;
  }
}

// Helper function to safely parse numeric values
function safeParseFloat(value, defaultValue = 0) {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Process database data for charts
function processDatabaseData(data) {
  sensorData = {
    fm1_flow_rate: [],
    fm2_flow_rate: [],
    fm1_volume: [],
    fm2_volume: [],
    friction_head_loss: [],
    minor_head_loss: [],
    total_head_loss: [],
  };

  console.log("Processing database data:", data);

  data.forEach((record, index) => {
    // FM1 Flow Rate
    if (record.fm1_flow_rate_lpm !== undefined && record.fm1_flow_rate_lpm !== null) {
      const flowRate = safeParseFloat(record.fm1_flow_rate_lpm);
      sensorData.fm1_flow_rate.push({
        time: index,
        value: flowRate,
        timestamp: record.reading_timestamp,
      });
    }

    // FM2 Flow Rate
    if (record.fm2_flow_rate_lpm !== undefined && record.fm2_flow_rate_lpm !== null) {
      const flowRate = safeParseFloat(record.fm2_flow_rate_lpm);
      sensorData.fm2_flow_rate.push({
        time: index,
        value: flowRate,
        timestamp: record.reading_timestamp,
      });
    }

    // FM1 Volume (convert mL to L)
    if (record.fm1_total_volume_ml !== undefined && record.fm1_total_volume_ml !== null) {
      const volumeMl = safeParseFloat(record.fm1_total_volume_ml);
      sensorData.fm1_volume.push({
        time: index,
        value: volumeMl, // Keep in mL for chart
        timestamp: record.reading_timestamp,
      });
    }

    // FM2 Volume (convert mL to L)
    if (record.fm2_total_volume_ml !== undefined && record.fm2_total_volume_ml !== null) {
      const volumeMl = safeParseFloat(record.fm2_total_volume_ml);
      sensorData.fm2_volume.push({
        time: index,
        value: volumeMl, // Keep in mL for chart
        timestamp: record.reading_timestamp,
      });
    }

    // Head Loss Data
    if (record.friction_head_loss_mm !== undefined && record.friction_head_loss_mm !== null) {
      const frictionLoss = safeParseFloat(record.friction_head_loss_mm);
      sensorData.friction_head_loss.push({
        time: index,
        value: frictionLoss,
        timestamp: record.reading_timestamp,
      });
    }

    if (record.minor_head_loss_mm !== undefined && record.minor_head_loss_mm !== null) {
      const minorLoss = safeParseFloat(record.minor_head_loss_mm);
      sensorData.minor_head_loss.push({
        time: index,
        value: minorLoss,
        timestamp: record.reading_timestamp,
      });
    }

    if (record.total_head_loss_mm !== undefined && record.total_head_loss_mm !== null) {
      const totalLoss = safeParseFloat(record.total_head_loss_mm);
      sensorData.total_head_loss.push({
        time: index,
        value: totalLoss,
        timestamp: record.reading_timestamp,
      });
    }
  });

  console.log("Processed sensor data:", sensorData);
}

// Update sensor values in dashboard (top cards)
function updateSensorValues(data) {
  if (!data || data.length === 0) return;

  const latest = data[0];

  try {
    const fm1FlowRate = document.getElementById("fm1FlowRate");
    const fm1Volume = document.getElementById("fm1Volume");
    const fm2FlowRate = document.getElementById("fm2FlowRate");
    const fm2Volume = document.getElementById("fm2Volume");

    if (fm1FlowRate && latest.fm1_flow_rate_lpm !== undefined) {
      const flowRate = safeParseFloat(latest.fm1_flow_rate_lpm);
      fm1FlowRate.textContent = flowRate.toFixed(2) + " L/min";
    }

    if (fm1Volume && latest.fm1_total_volume_l !== undefined) {
      const volumeL = safeParseFloat(latest.fm1_total_volume_l);
      fm1Volume.textContent = volumeL.toFixed(3) + " L";
    }

    if (fm2FlowRate && latest.fm2_flow_rate_lpm !== undefined) {
      const flowRate = safeParseFloat(latest.fm2_flow_rate_lpm);
      fm2FlowRate.textContent = flowRate.toFixed(2) + " L/min";
    }

    if (fm2Volume && latest.fm2_total_volume_l !== undefined) {
      const volumeL = safeParseFloat(latest.fm2_total_volume_l);
      fm2Volume.textContent = volumeL.toFixed(3) + " L";
    }

    // Update leak detection status
    const leakStatusValue = document.getElementById("leakStatusValue");
    const leakCount = document.getElementById("leakCount");
    
    if (leakStatusValue && latest.leak_status) {
      leakStatusValue.textContent = latest.leak_status;
      if (latest.leak_status.toLowerCase() === 'normal') {
        leakStatusValue.className = 'status-normal';
        if (leakCount) leakCount.textContent = '✓';
      } else {
        leakStatusValue.className = 'status-warning';
        if (leakCount) leakCount.textContent = '⚠';
      }
    }

  } catch (error) {
    console.error("Error updating sensor values:", error);
  }
}

// Update data table based on current table selection
function updateDataTable(data) {
  try {
    if (!data || data.length === 0) {
      // Clear all tables
      ['fm1TableBody', 'fm2TableBody', 'headlossTableBody'].forEach(tableId => {
        const tbody = document.getElementById(tableId);
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #666;">No data available</td></tr>`;
        }
      });
      return;
    }

    const latest = data[0];

    // Update FM1 Table - APPEND new row
    const fm1TableBody = document.getElementById("fm1TableBody");
    if (fm1TableBody) {
      // Remove "No data available" row if it exists
      const noDataRow = fm1TableBody.querySelector('td[colspan="4"]');
      if (noDataRow) {
        fm1TableBody.innerHTML = '';
      }

      const fm1FlowRate = safeParseFloat(latest.fm1_flow_rate_lpm);
      const fm1Velocity = safeParseFloat(latest.fm1_velocity_ms);
      const fm1VolumeMl = safeParseFloat(latest.fm1_total_volume_ml);
      const fm1VolumeL = fm1VolumeMl / 1000;

      // APPEND new row instead of replacing
      fm1TableBody.insertAdjacentHTML('afterbegin', `
        <tr>
          <td>${fm1FlowRate.toFixed(2)} L/min</td>
          <td>${fm1Velocity.toFixed(3)} m/s</td>
          <td>${fm1VolumeMl.toFixed(0)} mL (${fm1VolumeL.toFixed(3)} L)</td>
          <td>${latest.reading_timestamp || new Date().toLocaleString('id-ID')}</td>
        </tr>
      `);
    }

    // Update FM2 Table - APPEND new row
    const fm2TableBody = document.getElementById("fm2TableBody");
    if (fm2TableBody) {
      // Remove "No data available" row if it exists
      const noDataRow = fm2TableBody.querySelector('td[colspan="4"]');
      if (noDataRow) {
        fm2TableBody.innerHTML = '';
      }

      const fm2FlowRate = safeParseFloat(latest.fm2_flow_rate_lpm);
      const fm2Velocity = safeParseFloat(latest.fm2_velocity_ms);
      const fm2VolumeMl = safeParseFloat(latest.fm2_total_volume_ml);
      const fm2VolumeL = fm2VolumeMl / 1000;

      // APPEND new row instead of replacing
      fm2TableBody.insertAdjacentHTML('afterbegin', `
        <tr>
          <td>${fm2FlowRate.toFixed(2)} L/min</td>
          <td>${fm2Velocity.toFixed(3)} m/s</td>
          <td>${fm2VolumeMl.toFixed(0)} mL (${fm2VolumeL.toFixed(3)} L)</td>
          <td>${latest.reading_timestamp || new Date().toLocaleString('id-ID')}</td>
        </tr>
      `);
    }

    // Update Head Loss Table - APPEND new row
    const headlossTableBody = document.getElementById("headlossTableBody");
    if (headlossTableBody) {
      // Remove "No data available" row if it exists
      const noDataRow = headlossTableBody.querySelector('td[colspan="4"]');
      if (noDataRow) {
        headlossTableBody.innerHTML = '';
      }

      const frictionLoss = safeParseFloat(latest.friction_head_loss_mm);
      const minorLoss = safeParseFloat(latest.minor_head_loss_mm);
      const totalLoss = safeParseFloat(latest.total_head_loss_mm);

      // APPEND new row instead of replacing
      headlossTableBody.insertAdjacentHTML('afterbegin', `
        <tr>
          <td>${frictionLoss.toFixed(1)} mm</td>
          <td>${minorLoss.toFixed(1)} mm</td>
          <td>${totalLoss.toFixed(1)} mm</td>
          <td>${latest.reading_timestamp || new Date().toLocaleString('id-ID')}</td>
        </tr>
      `);
    }

    // Optional: Limit number of rows to prevent infinite growth
    const maxRows = 10; // Keep only last 10 entries
    [fm1TableBody, fm2TableBody, headlossTableBody].forEach(tbody => {
      if (tbody && tbody.children.length > maxRows) {
        // Remove oldest rows (from the end)
        while (tbody.children.length > maxRows) {
          tbody.removeChild(tbody.lastElementChild);
        }
      }
    });

  } catch (error) {
    console.error("Error updating data table:", error);
  }
}

// Show/hide table containers based on current selection
function showTableContainer(tableType) {
  const containers = ['fm1Table', 'fm2Table', 'headlossTable'];
  
  containers.forEach(containerId => {
    const container = document.getElementById(containerId);
    if (container) {
      if (containerId === tableType + 'Table') {
        container.classList.add('active');
      } else {
        container.classList.remove('active');
      }
    }
  });
}

// Update chart with canvas
function updateChart() {
  if (chart) {
    chart.updateData(sensorData);
    chart.setChart(currentChart);
    chart.render();
  }
}

// Real-time data fetching
async function startRealtime() {
  if (!isRealtime) return;

  try {
    const latestData = await fetchSensorData(10);

    if (latestData && latestData.length > 0) {
      updateSensorValues(latestData);
      updateDataTable(latestData);

      const allData = await fetchAllSensorData();
      processDatabaseData(allData);
      updateChart();
    }
    updateConnectionStatus(true);
  } catch (error) {
    console.error("Error in real-time update:", error);
    updateConnectionStatus(false);
  }
}

// Load initial data
async function loadInitialData() {
  try {
    const initialData = await fetchSensorData(10);
    updateSensorValues(initialData);
    updateDataTable(initialData);

    const allData = await fetchAllSensorData();
    processDatabaseData(allData);
    updateChart();
  } catch (error) {
    console.error("Error loading initial data:", error);
    handleError(error);
  }
}

// Setup serial data listener
function setupSerialDataListener() {
  try {
    window.api.receive("serial-data-received", (data) => {
      console.log("Serial data received:", data);

      insertSensorData(data).then((result) => {
        if (result && result.success) {
          console.log("Serial data saved to database");
          if (isRealtime) {
            startRealtime();
          }
        }
      });
    });

    window.api.receive("serial-port-status", (status) => {
      console.log("Serial port status:", status);
      updateConnectionStatus(status.connected);
    });

    window.api.receive("serial-port-error", (error) => {
      console.error("Serial port error:", error);
      updateConnectionStatus(false);
      handleError(new Error(`Serial port error: ${error.message}`));
    });
  } catch (error) {
    console.error("Error setting up serial data listener:", error);
  }
}

// Event listeners and initialization
document.addEventListener("DOMContentLoaded", async function () {
  try {
    if (!window.api) {
      console.error("Electron API not available");
      handleError(new Error("Backend connection not available"));
      return;
    }

    // Initialize canvas chart
    chart = new FlowMeterChart('sensorChart');

    // setupSerialDataListener();
    await loadInitialData();

    // Real-time toggle
    const realtimeBtn = document.getElementById("realtimeBtn");
    const realtimeText = document.getElementById("realtimeText");

    if (realtimeBtn && realtimeText) {
      realtimeBtn.addEventListener("click", function () {
        isRealtime = !isRealtime;

        if (isRealtime) {
          realtimeText.textContent = "Real-time ON";
          this.classList.remove("active");
          if (realtimeInterval) clearInterval(realtimeInterval);
          realtimeInterval = setInterval(startRealtime, 5000);
        } else {
          realtimeText.textContent = "Real-time OFF";
          this.classList.add("active");
          if (realtimeInterval) clearInterval(realtimeInterval);
        }
      });
    }

    // Table navigation controls
    const tableBtns = document.querySelectorAll(".table-btn");
    tableBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        tableBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        currentTable = this.dataset.table;
        showTableContainer(currentTable);
      });
    });

    // Chart controls
    const chartBtns = document.querySelectorAll(".chart-btn");
    chartBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        chartBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        currentChart = this.dataset.chart;
        updateChart();
      });
    });

    // Sampling interval slider
    const samplingSlider = document.getElementById("samplingSlider");
    const sliderValue = document.getElementById("sliderValue");

    if (samplingSlider && sliderValue) {
      samplingSlider.addEventListener("input", function () {
        sliderValue.textContent = this.value;
        
        // Update real-time interval if active
        if (isRealtime && realtimeInterval) {
          clearInterval(realtimeInterval);
          realtimeInterval = setInterval(startRealtime, this.value * 1000);
        }
      });
    }

    // Start monitoring button functionality
    const startBtn = document.getElementById("startBtn");
    if (startBtn) {
      startBtn.addEventListener("click", async function () {
        const deviceSelect = document.getElementById("deviceSelect");
        const samplingSlider = document.getElementById("samplingSlider");

        if (!deviceSelect || !samplingSlider) return;

        const device = deviceSelect.value;
        const samplingInterval = samplingSlider.value;

        this.innerHTML = '<div class="loading"></div> STARTING...';
        this.style.background = "linear-gradient(45deg, #ff9800, #f57c00)";
        this.disabled = true;

        try {
          // Simulate starting the monitoring system
          setTimeout(() => {
            this.textContent = "MONITORING ACTIVE";
            this.style.background = "linear-gradient(45deg, #4CAF50, #45a049)";

            // Update system status
            const systemStatusValue = document.getElementById("systemStatusValue");
            const systemCount = document.getElementById("systemCount");
            
            if (systemStatusValue) systemStatusValue.textContent = "Active - Monitoring";
            if (systemCount) systemCount.textContent = "✓";

            // Start real-time monitoring if not already active
            if (!isRealtime) {
              const realtimeBtn = document.getElementById("realtimeBtn");
              const realtimeText = document.getElementById("realtimeText");
              
              if (realtimeBtn && realtimeText) {
                isRealtime = true;
                realtimeText.textContent = "Real-time ON";
                realtimeBtn.classList.remove("active");
                if (realtimeInterval) clearInterval(realtimeInterval);
                realtimeInterval = setInterval(startRealtime, samplingInterval * 1000);
              }
            }
          }, 2000);

          setTimeout(() => {
            this.textContent = "START MONITORING";
            this.style.background = "linear-gradient(45deg, #4CAF50, #45a049)";
            this.disabled = false;
          }, 8000);

        } catch (error) {
          console.error("Error starting monitoring:", error);
          this.textContent = "ERROR";
          this.style.background = "linear-gradient(45deg, #f44336, #d32f2f)";
          setTimeout(() => {
            this.textContent = "START MONITORING";
            this.style.background = "linear-gradient(45deg, #4CAF50, #45a049)";
            this.disabled = false;
          }, 3000);
        }
      });
    }

    // Navigation menu functionality
    const navItems = document.querySelectorAll(".nav-item a");
    navItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
        this.parentElement.classList.add("active");
        const section = this.getAttribute("href").substring(1);
        handleSectionChange(section);
      });
    });

    // Initialize table and chart display
    showTableContainer(currentTable);
    updateChart();

    // Start real-time updates
    if (realtimeInterval) clearInterval(realtimeInterval);
    realtimeInterval = setInterval(startRealtime, 5000);

    // Update current time
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

  } catch (error) {
    console.error("Error during initialization:", error);
    handleError(error);
  }
});

// Handle section changes
function handleSectionChange(section) {
  try {
    switch (section) {
      case "dashboard":
        loadInitialData();
        break;
      case "controller":
        showControllerSection();
        break;
      case "log":
        showLogSection();
        break;
    }
  } catch (error) {
    console.error("Error handling section change:", error);
  }
}

// Show controller section
function showControllerSection() {
  alert("Controller section - Feature coming soon!");
}

// Show log section
function showLogSection() {
  alert("Log Device section - Feature coming soon!");
}

// Update connection status
function updateConnectionStatus(isConnected = true) {
  try {
    const statusElement = document.getElementById("connectionStatus");
    const statusDot = document.querySelector(".status-dot");

    if (!statusElement || !statusDot) return;

    if (isConnected) {
      statusElement.textContent = "Connected";
      statusDot.style.background = "#4CAF50";
    } else {
      statusElement.textContent = "Disconnected";
      statusDot.style.background = "#f44336";

      if (isRealtime) {
        const realtimeText = document.getElementById("realtimeText");
        const realtimeBtn = document.getElementById("realtimeBtn");

        if (realtimeText) realtimeText.textContent = "Connection Lost";
        if (realtimeBtn) realtimeBtn.classList.add("active");
        if (realtimeInterval) clearInterval(realtimeInterval);

        setTimeout(() => {
          if (realtimeText) realtimeText.textContent = "Reconnecting...";
          setTimeout(loadInitialData, 2000);
        }, 3000);
      }
    }
  } catch (error) {
    console.error("Error updating connection status:", error);
  }
}

// Update current time
function updateCurrentTime() {
  try {
    const timeElement = document.getElementById("currentTime");
    const timeElements = ["currentTime1", "currentTime2", "currentTime3"];
    
    timeElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        const now = new Date();
        element.textContent = now.toLocaleString("id-ID");
      }
    });

    if (timeElement) {
      const now = new Date();
      timeElement.textContent = now.toLocaleString("id-ID");
    }
  } catch (error) {
    console.error("Error updating current time:", error);
  }
}

// Enhanced error handling
function handleError(error) {
  console.error("Dashboard Error:", error);

  try {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      max-width: 300px;
      font-size: 14px;
    `;
    errorDiv.textContent = "Database connection error. Retrying...";
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 5000);
  } catch (e) {
    console.error("Error showing error message:", e);
  }
}

// Export data functionality
async function exportData() {
  try {
    const allData = await fetchAllSensorData();

    if (!allData || allData.length === 0) {
      alert("No data to export");
      return;
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,FM1_Flow_Rate,FM1_Velocity,FM1_Volume_L,FM2_Flow_Rate,FM2_Velocity,FM2_Volume_L,Friction_Loss,Minor_Loss,Total_Loss,Leak_Status,Timestamp\n" +
      allData
        .map(
          (record) =>
            `${record.id || ""},${record.fm1_flow_rate_lpm || ""},${record.fm1_velocity_ms || ""},${record.fm1_total_volume_l || ""},${record.fm2_flow_rate_lpm || ""},${record.fm2_velocity_ms || ""},${record.fm2_total_volume_l || ""},${record.friction_head_loss_mm || ""},${record.minor_head_loss_mm || ""},${record.total_head_loss_mm || ""},${record.leak_status || ""},${record.reading_timestamp || ""}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "flow_meter_data_" + new Date().toISOString().split("T")[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting data:", error);
    alert("Error exporting data. Please try again.");
  }
}

// Cleanup function for page unload
window.addEventListener("beforeunload", function () {
  if (realtimeInterval) {
    clearInterval(realtimeInterval);
  }

  try {
    if (window.api) {
      window.api.removeAllListeners("serial-data-received");
      window.api.removeAllListeners("serial-port-status");
      window.api.removeAllListeners("serial-port-error");
    }
  } catch (error) {
    console.error("Error cleaning up listeners:", error);
  }
});