import { uiText } from '../../../../config/uiText.js';

const VIEWBOX = { width: 360, height: 250 };
const DNA_X1 = 126;
const DNA_X2 = 266;
const TOP = 36;
const STEP = 28;

export function ExpectedGenomePreview({ parentGenomes, expectedLoci, isActive = false }) {
  const flowTargets = parentGenomes.map((parent, index) => ({
    name: parent.name,
    y: 48 + index * 52,
    weight: parent.weight,
  }));

  return (
    <section className={`mix-synthesis ${isActive ? 'is-active' : ''}`}>
      <div className="mix-section-head">
        <h3>{uiText.mixing.geneSynthesisTitle}</h3>
        <span>{uiText.mixing.expectedGenomeTitle}</span>
      </div>
      <svg className="mix-synthesis-svg" viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="img" aria-label={uiText.mixing.expectedGenomeTitle}>
        {flowTargets.map((target) => (
          <path
            className="mix-synthesis-flow"
            d={`M 24 ${target.y} C 76 ${target.y}, 76 126, ${DNA_X1 - 14} 126`}
            key={target.name}
            style={{
              '--flow-opacity': 0.18 + target.weight * 0.62,
              '--flow-width': 1 + target.weight * 5,
            }}
          />
        ))}
        {flowTargets.map((target) => (
          <g className="mix-synthesis-parent-node" key={`node-${target.name}`}>
            <circle cx="24" cy={target.y} r={5 + target.weight * 7} />
            <text x="24" y={target.y + 22}>{target.name}</text>
          </g>
        ))}
        <path className="mix-synthesis-backbone" d={`M ${DNA_X1} 20 C ${DNA_X1 - 18} 82, ${DNA_X1 + 18} 166, ${DNA_X1} 230`} />
        <path className="mix-synthesis-backbone" d={`M ${DNA_X2} 20 C ${DNA_X2 + 18} 82, ${DNA_X2 - 18} 166, ${DNA_X2} 230`} />
        {expectedLoci.map((locus, index) => {
          const y = TOP + index * STEP;
          const markerX = DNA_X1 + (DNA_X2 - DNA_X1) * locus.value;
          return (
            <g className="mix-synthesis-locus" key={locus.id}>
              <title>{`${locus.label}: ${locus.valueLabel} · ${locus.contribution}`}</title>
              <line x1={DNA_X1} y1={y} x2={DNA_X2} y2={y} />
              <circle className="mix-synthesis-joint" cx={DNA_X1} cy={y} r="3.2" />
              <circle className="mix-synthesis-joint" cx={DNA_X2} cy={y} r="3.2" />
              <circle className="mix-synthesis-marker" cx={markerX} cy={y} r="5.4" />
            </g>
          );
        })}
      </svg>
      <div className="mix-synthesis-contributions">
        {expectedLoci.map((locus) => (
          <div key={locus.id}>
            <span>{locus.label.replace('基因', '')}</span>
            <strong>{locus.contribution}</strong>
          </div>
        ))}
      </div>
      <section className="mix-harmony-sources">
        <h4>{uiText.mixing.harmonySourcesTitle}</h4>
        {parentGenomes.map((parent) => (
          <p key={parent.name}><strong>{parent.name}</strong>: {parent.chords.length ? parent.chords.join(' → ') : uiText.gene.noChords}</p>
        ))}
        <small>{uiText.mixing.harmonyPreviewHint}</small>
      </section>
    </section>
  );
}
