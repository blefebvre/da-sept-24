const NETWORKS = [
  {
    name: 'Twitter',
    className: 'share-twitter',
    url: (href, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(href)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: 'Facebook',
    className: 'share-facebook',
    url: (href) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(href)}`,
  },
];

/**
 * Share bar (page metadata `Share: true`): share links for the current page.
 * @param {Element} block The share block element
 */
export default function decorate(block) {
  const [href] = window.location.href.split('#');
  const { title } = document;

  const label = document.createElement('span');
  label.className = 'share-label';
  label.textContent = 'Share:';

  const ul = document.createElement('ul');
  NETWORKS.forEach((network) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = network.className;
    a.href = network.url(href, title);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', `Share on ${network.name} (opens in a new tab)`);
    li.append(a);
    ul.append(li);
  });

  block.replaceChildren(label, ul);
}
