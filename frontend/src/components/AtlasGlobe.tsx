/** Decorative atlas illustration, independent of user and geographic data. */
export function AtlasGlobe() {
  return (
    <div className="atlas-illustration" aria-hidden="true">
      <div className="atlas-orbit" />
      <div className="atlas-globe">
        <i className="atlas-meridian atlas-meridian-one" />
        <i className="atlas-meridian atlas-meridian-two" />
        <i className="atlas-equator" />
        <i className="atlas-latitude atlas-latitude-north" />
        <i className="atlas-latitude atlas-latitude-south" />
        <span className="atlas-point atlas-point-one" />
        <span className="atlas-point atlas-point-two" />
        <span className="atlas-point atlas-point-three" />
      </div>
      <span className="atlas-axis">N</span>
      <span className="atlas-caption">A WORLD OF POSSIBILITIES</span>
    </div>
  );
}
