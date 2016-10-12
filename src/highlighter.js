import * as d3 from 'd3';

export function highlightTeam(slug) {
  d3.selectAll('.team > path')
    .transition()
    .duration(15)
    .ease(d3.easeLinear)
    .style('stroke-width', d => (slug === d.css_slug) ? '3px' : '1px')
    .style('stroke', d => (slug === d.css_slug) ? d.color : 'gray');

  d3.selectAll('.team-label')
    .transition()
    .duration(15)
    .attr('fill', d => (slug === d.css_slug) ? 'black' : 'gray')
    .attr('font-weight', d => (slug === d.css_slug) ? 900 : 100);

  d3.selectAll(`.${slug} > circle`)
    .transition()
    .duration(200)
    .ease(d3.easeLinear)
    .style('opacity', 1);
}

export function highlightAll() {
  d3.selectAll('.team path')
    .transition()
    .duration(15)
    .ease(d3.easeLinear)
    .style('stroke', d => d.color)
    .style('stroke-width', '1.5px');

  d3.selectAll('.team-label')
    .transition()
    .duration(15)
    .attr('font-weight', 100)
    .attr('fill', 'black');

  d3.selectAll('.team circle')
    .transition()
    .duration(15)
    .ease(d3.easeLinear)
    .style('opacity', 0);
}

