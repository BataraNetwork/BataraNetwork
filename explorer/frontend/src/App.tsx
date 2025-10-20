import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Blocks from './pages/Blocks';
import BlockDetail from './pages/BlockDetail';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import AddressDetail from './pages/AddressDetail';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blocks" element={<Blocks />} />
          <Route path="/block/:height" element={<BlockDetail />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/tx/:id" element={<TransactionDetail />} />
          <Route path="/address/:address" element={<AddressDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
