import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// // Use default bootstrap
// import 'bootstrap/dist/css/bootstrap.css';
import './simplex-theme.css'

// Use font awesome
import 'font-awesome/css/font-awesome.min.css'

// https://github.com/parcel-bundler/parcel/issues/2724
import("jquery").then(async (jquery) => {
  (window as any).$ = jquery.default;
  (window as any).jQuery = jquery.default;
  await import('bootstrap');
})

ReactDOM.render(<App />, document.getElementById('root'));
