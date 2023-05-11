// import './App.css';
import './styles.css';
import React, { useState, useEffect } from 'react';
import customers from './customers.json';
import { Chart } from 'chart.js/auto';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Box, Table, TableCell, TableBody, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

function App() {

  // STATES
  const [schoolState, setSchoolState] = useState("All Schools");
  const [customerData, setCustomerData] = useState(customers);
  const [conversionData, setConversionData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [pickupData, setPickupData] = useState([]);
  const [conversionRate, setConversionRate] = useState('')

  // SCHOOL SELECT
  const SchoolSelect = (props) => {
    return (
      <select
        className="schoolSelect"
        value={props.school}
        onChange={(event) => setSchoolState(event.target.value)}
      >
        <option>All Schools</option>
        <option>Brown</option>
        <option>Columbia</option>
        <option>Cornell</option>
        <option>Dartmouth</option>
        <option>Harvard</option>
        <option>Princeton</option>
        <option>UPenn</option>
        <option>Yale</option>
      </select>
    );
  };

  // MONTHLY REV CALCULATION
  function calculateRevenueByMonth(data, schoolState) {
    // Initialize an empty array to store the revenue data
    const revenueByMonth = [];

    // Iterate over the customer data and calculate the projected revenue for each month
    data.forEach(customer => {
      if (customer.school === schoolState || schoolState === "All Schools") {
        const pickupDate = new Date(customer.pickupDate);
        const returnDate = new Date(customer.returnDate);

        // Calculate the number of months between the pickup and return dates
        const months = (returnDate.getFullYear() - pickupDate.getFullYear()) * 12 + (returnDate.getMonth() - pickupDate.getMonth());

        // Calculate the revenue per month
        const revenuePerMonth = customer.monthlyCost;

        // Iterate over each month and add the revenue to the array
        for (let i = 0; i < months; i++) {
          const month = new Date(pickupDate.setMonth(pickupDate.getMonth() + 1));
          const monthName = month.toLocaleString('default', { month: 'short' });
          const year = month.getFullYear();
          const label = `${monthName} ${year}`;
          const revenue = revenueByMonth.find(item => item.label === label);

          if (revenue) {
            revenue.value += revenuePerMonth;
          } else {
            revenueByMonth.push({ label, value: revenuePerMonth });
          }
        }
      }
    });

    // Return the revenue data
    return revenueByMonth;
  }

  // CONVERSION DATA
  function calculateConversion(data, schoolState) {
    // Initialize variables for conversion
    let conversionRate = 0;
    let accounts = 0;
    let orders = 0;

    // Iterate over the customer data and calculate the conversion rate
    data.forEach(customer => {
      if (customer.school === schoolState || schoolState === "All Schools") {
        accounts = accounts + 1;
        if (customer.hasOwnProperty("numItems")) {
          orders = orders + 1;
        }
      }
    });

    conversionRate = orders / accounts * 100;
    const conversionData = [orders, accounts - orders, conversionRate];

    return conversionData;
  }

  // PICKUP DATA
  function calculatePickupData(data, schoolState) {
    // Initialize an empty array to store the pickup data
    const pickupInfo = [];

    // Iterate over the customer data and calculate the customers and items for each date
    data.forEach(customer => {
      if (customer.school === schoolState || schoolState === "All Schools") {

        const pickupDate = new Date(customer.pickupDate);
        const returnDate = new Date(customer.returnDate);

        // Calculate the number of months between the pickup and return dates
        const months = (returnDate.getFullYear() - pickupDate.getFullYear()) * 12 + (returnDate.getMonth() - pickupDate.getMonth());

        // Get the items per customer
        const items = customer.numItems;

        // Iterate over dates to count items and customers
        for (let i = 0; i < months; i++) {
          const dateUTC = new Date(pickupDate.setMonth(pickupDate.getMonth() + 1));
          const day = dateUTC.getDate();
          const year = dateUTC.getFullYear();
          const month = dateUTC.getMonth();
          const date = `${month}/${day}/${year}`;
          const pickupItems = pickupInfo.find(item => item.date === date);

          if (pickupItems) {
            pickupItems.items += items;
            pickupItems.customers += 1;
          } else {
            pickupInfo.push({ date, items, customers: 1 });
          }
        }
      }
    });

    // Sort pickup data and return
    var pickupSorted = pickupInfo.sort((a, b) => a.date[0] - b.date[0]);
    return pickupSorted;
  }

  // Hook for collecting updated data
  useEffect(() => {
    setPickupData(calculatePickupData(customerData, schoolState));
    setConversionData(calculateConversion(customerData, schoolState));
    setRevenueData(calculateRevenueByMonth(customerData, schoolState));
  }, [customerData, schoolState]);

  // Hook for conversion rate
  useEffect(() => {
    setConversionRate(Math.floor(conversionData[0] / (conversionData[0] + conversionData[1]) * 100));
  }, [conversionData]);

  // Conversion data for conversion chart
  const conversionChartData = {
    labels: ["Reservations", "Accounts without Reservations"],
    datasets: [{
      data: [conversionData[0], conversionData[1]],
      backgroundColor: [
        '#307a42',
        '#eee'
      ]
    }]
  }

  // Revenue data for revenue chart
  const revenueChartData = {
    labels: revenueData.map(function (label) { return label.label }),
    datasets: [{
      label: "Monthly Revenue",
      data: revenueData.map(function (value) { return value.value }),
      backgroundColor: ['#307a42']
    }]

  };

  return (
    <div className="App">
      {/* Title */}
      <Typography className='headingTypo' variant="h3" mt={4}>Greenbox Storage Widgets</Typography>

      {/* SCHOOL SELECT DROPDOWN OPTION */}
      <SchoolSelect
        school={schoolState}
      />

      <Box className='chartDiv'>

        {/* REVENUE CHART */}
        <Box className='chartBox'>
          <Bar data={revenueChartData} />
        </Box>

        {/* CONVERSION CHART */}
        <Box className='chartBox'>
          <Doughnut data={conversionChartData} options={{
            responsive: true,
            maintainAspectRatio: true,
          }} />
          <Typography>Conversion Rate: {conversionRate}%</Typography>
        </Box>

        {/* PICKUP DATE CHART */}
        <Box className='chartBox'>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 300 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Date</TableCell>
                  <TableCell align="center">Customers</TableCell>
                  <TableCell align="center">Items</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pickupData.map((row) => (
                  <TableRow
                    key={row.name}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell align="center" component="th" scope="row">
                      {row.date}
                    </TableCell>
                    <TableCell align="center">{row.customers}</TableCell>
                    <TableCell align="center">{row.items}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </div>
  );
}

export default App;
