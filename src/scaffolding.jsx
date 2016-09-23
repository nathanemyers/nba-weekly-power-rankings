import React from 'react';

export const Spinner = React.createClass({
  render: () => {
    return (
      <div id="spinner-container">
        <div className="sk-cube-grid">
          <div className="sk-cube sk-cube1"></div>
          <div className="sk-cube sk-cube2"></div>
          <div className="sk-cube sk-cube3"></div>
          <div className="sk-cube sk-cube4"></div>
          <div className="sk-cube sk-cube5"></div>
          <div className="sk-cube sk-cube6"></div>
          <div className="sk-cube sk-cube7"></div>
          <div className="sk-cube sk-cube8"></div>
          <div className="sk-cube sk-cube9"></div>
        </div>
      </div>
    );
  }
});

export const PanningControls = React.createClass({
  render: () => {
    return (
      <div className="panning-controls">
        <span id="left-button" className="button">
          <i className="fa fa-long-arrow-left" aria-hidden="true"></i>
        </span>
        <span id="right-button" className="button">
          <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
        </span>
      </div>
    );
  }
})

ReactDOM.render(
  <div>
    <Spinner/>
    <div className="power-rankings">
      <div className="chart"/>
      <PanningControls/>,
    </div>
  </div>,
  document.body
);

