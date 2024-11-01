import React from 'react';

const Home = ({user, data}) =>{
    return <div>
        {user ? 
            <React.Fragment>
                <div>Hello {user}</div>
                <div>data</div>
            </React.Fragment> :
            <React.Fragment>
                <div>Please Register or Login</div>
            </React.Fragment>
        }
    </div>
}

export default Home;