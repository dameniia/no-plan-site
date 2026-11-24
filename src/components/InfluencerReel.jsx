import { Link } from "react-router-dom";
import PropTypes from "prop-types";

function InfluencerCard({ handle, followers, image, quote }) {
  return (
    <figure className="np-reel-card">
      <img
        className="np-reel-img"
        src={image}
        alt={`AI-generated portrait of the fictional influencer ${handle}`}
        loading="lazy"
        width="360"
        height="640"
      />
      <span className="np-reel-badge">AI-generated</span>
      <figcaption className="np-reel-cap">
        <blockquote className="np-reel-quote">{quote}</blockquote>
        <p className="np-reel-handle">
          {handle}
          <span>{followers} (also not real)</span>
        </p>
      </figcaption>
    </figure>
  );
}

InfluencerCard.propTypes = {
  handle: PropTypes.string.isRequired,
  followers: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  quote: PropTypes.string.isRequired,
};

export function InfluencerReel({ influencers }) {
  return (
    <section className="np-section np-section--ink" id="influencers" aria-labelledby="influencers-heading">
      <div className="np-inner">
        <div className="np-reel-head np-reveal">
          <h2 className="np-heading" id="influencers-heading">
            Loved by influencers (who don&apos;t exist).
          </h2>
          <p className="np-body">
            Every creator below is AI-generated. We don&apos;t have famous fans yet,
            so we made some up.
          </p>
        </div>
        <div className="np-rail np-reel" tabIndex={0} aria-label="AI-generated parody testimonials">
          {influencers.map((person) => (
            <InfluencerCard key={person.handle} {...person} />
          ))}
        </div>
        <p className="np-body np-reel-foot">
          Real reviews will go here once real people write them.{" "}
          <Link to="/feedback" className="np-link">Write the first one</Link>
        </p>
      </div>
    </section>
  );
}

InfluencerReel.propTypes = {
  influencers: PropTypes.arrayOf(
    PropTypes.shape({
      handle: PropTypes.string.isRequired,
      followers: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      quote: PropTypes.string.isRequired,
    })
  ).isRequired,
};
