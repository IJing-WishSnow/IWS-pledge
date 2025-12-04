import React from 'react';
import classnames from 'classnames';
import Footer from '_components/Footer';

import './index.less';

interface IWebLayout {
  children?: React.ReactNode;
  className?: string;
}

const WebLayout: React.FC<IWebLayout> = ({ children, className }) => (
  <div className={classnames('web-layout', className)}>
    {children}
    <Footer />
  </div>
);

export default WebLayout;
