import { DerpEnginePage } from './app.po';

describe('derp-engine App', function() {
  let page: DerpEnginePage;

  beforeEach(() => {
    page = new DerpEnginePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
