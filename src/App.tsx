import React from 'react';
import './App.css';
import {Route, Routes} from 'react-router-dom';
import Header from './components/Header';
import { ListeFlottes } from './screens/ListeFlottes';
import {ReportProvider} from './context/ReportContext';

function App() {
    return (<ReportProvider>
            <div className="app-root">
                <Header/>
                <div className="app-body" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>

                    <main
                        className="app-main"
                        style={{flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column'}}
                    >
                        <Routes>
                            <Route path="/" element={<ListeFlottes/>}/>
                            <Route path="/flottes" element={<ListeFlottes/>}/>
                        </Routes>
                    </main>
                </div>
            </div>
        </ReportProvider>);
}

export default App;
