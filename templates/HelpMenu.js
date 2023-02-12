import React from 'react';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';


const initialState = {
    mouseX: null,
    mouseY: null,
};

export default function HelpMenu() {
    const [state, setState] = React.useState(initialState);

    const handleClick = event => {
        event.preventDefault();
        setState({
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
        });
    }

    const handleCloseOnly = (link) => {
        setState(initialState);
    }

    const handleClose = (link) => {
        setState(initialState);
        window.open(link, 'help');
    }

    const handleCloseForCancerCohort = () => {
        handleClose('https://calteachersstudy.my.salesforce.com/sfc/p/#i0000000IQ7M/a/1Y0000001Eqg/1pAKU9THtnq2fDHD_bkIObOGMZXmofFVmFITiTeAr9I');
    }

    const handleCloseForNonCancerCohort = () => {
        handleClose('https://calteachersstudy.my.salesforce.com/sfc/p/#i0000000IQ7M/a/1Y0000001ErK/uSwONX4cZpIX7GNZochechTj1ZrTbIckCJSW5pu0zss');
    }

    return (
        <div>
            <Button style={{color: 'white'}} onClick={handleClick}>
                Help
            </Button>
            <Menu
                keepMounted
                open={state.mouseY !== null}
                onClose={handleCloseOnly}
                anchorReference="anchorPosition"
                anchorPosition={
                    state.mouseY !== null && state.mouseX !== null
                        ? {top: 50, left: state.mouseX - 25}
                        : undefined
                }
            >
                <MenuItem style={{minHeight: '28px'}}
                          onClick={handleCloseForCancerCohort}>
                    Cancer-Cohort Projects
                </MenuItem>
                <MenuItem style={{minHeight: '28px'}}
                          onClick={handleCloseForNonCancerCohort}>
                    Non Cancer-Cohort Projects
                </MenuItem>
            </Menu>
        </div>
    );
}
