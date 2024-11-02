
import React from 'react'
import axios from 'axios'
import './App.css';
import { Routes, Route, Link } from 'react-router-dom'
import Home from './components/Home/Home'
import Register from './components/Register/Register'
import Login from './components/Login/Login'

class App extends React.Component {
  state = {
    data: null,
    token: null,
    user: null
  }

  componentDidMount(){
    axios.get('http://localhost:5000')
    .then((response)=>{
      this.setState({
        data: response.data
      })
    }).catch((error)=>{
      console.error(`Error fetching data: ${error}`);
    })

    this.authenticateUser();
  }

  authenticateUser = () =>{
    const token = localStorage.getItem('token');

    if(!token){
      localStorage.removeItem('user');
      this.setState({user: null});
    }

    if(token){
      const config = {
        headers: {
          'x-auth-token' : token
        }
      }

      axios.get('http://localhost:5000/api/auth', config)
        .then((response)=>{
          localStorage.setItem('user', response.data.name)
          this.setState({user: response.data.name})
        })
        .catch((error)=>{
          localStorage.removeItem('user');
          this.setState({user: null});
          console.error(`Error logging in: ${error}`);
        })
    }
  }

  render(){
    return(
      <div className="App">
        <header className="App-header">
          <h1>Good Things</h1>
          <ul>
            <li><Link to='/'>Home</Link></li>
            <li><Link to='/register'>Register</Link></li>
            <li><Link to='/login'>Login</Link></li>
          </ul>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/register" element={<Register/>} />
            <Route path="/login" element={<Login/>} />
          </Routes>
        </main>
      </div>
    )
  }
}

export default App;
