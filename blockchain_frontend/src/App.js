import "./App.css";
import Information from "./components/Information/information";
import Home from "./components/Home/home";
import Login from "./components/Login/login";

import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";


export default function App() {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={Home} />
                <Route exact path="/login" component={Login} />
                <Route exact path="/info" component={Information} />
            </Switch>
        </Router>
    )
};
