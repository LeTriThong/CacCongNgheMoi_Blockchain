import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import "./App.css";
import Home from "./components/Home/home";
import Information from "./components/Information/information";
import Login from "./components/Login/login";




export default function App() {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={Information} />
                <Route exact path="/home" component={Home} />
                <Route exact path="/login" component={Login} />
            </Switch>
        </Router>
    )
};
