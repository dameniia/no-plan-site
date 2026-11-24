import PropTypes from "prop-types";

// Full-bleed decorative photo band between sections. The image drifts slower
// than the page via a CSS scroll-driven animation (see `.np-parallax` in
// noplan.css); browsers without support, and reduced-motion users, get a
// static image.
export function ParallaxBand({ src }) {
  return (
    <div className="np-parallax" aria-hidden="true">
      <img className="np-parallax-img" src={src} alt="" loading="lazy" decoding="async" />
    </div>
  );
}

ParallaxBand.propTypes = {
  src: PropTypes.string.isRequired,
};
