import { Component, DebugElement, ElementRef, Input, NgModule, OnInit } from '@angular/core';
import { async, fakeAsync, flush, tick, ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';

import { NzButtonComponent } from '../button/nz-button.component';
import { NzButtonModule } from '../button/nz-button.module';

import { CssUnitPipe } from './css-unit.pipe';
import { ModalPublicAgent } from './modal-public-agent.class';
import { MODAL_ANIMATE_DURATION, NzModalComponent } from './nz-modal.component';
import { NzModalModule } from './nz-modal.module';
import { NzModalService } from './nz-modal.service';

const WAIT_ANIMATE_TIME = MODAL_ANIMATE_DURATION + 50;

describe('modal', () => {
  let instance;
  let fixture: ComponentFixture<{}>;

  describe('demo-async', () => {
    let modalElement: HTMLElement;
    let buttonShow: HTMLButtonElement;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [ NzButtonModule, NzModalModule ],
        declarations: [ NzDemoModalAsyncComponent ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(NzDemoModalAsyncComponent);
      instance = fixture.debugElement.componentInstance;
      modalElement = fixture.debugElement.query(By.directive(NzModalComponent)).nativeElement;
      buttonShow = fixture.debugElement.query(By.directive(NzButtonComponent)).nativeElement;
    });

    it('should show and hide after 3000ms with loading', fakeAsync(() => {
      buttonShow.click();
      fixture.detectChanges();
      flush();
      expectModalHidden(modalElement, false);

      const buttonOk = getButtonOk(modalElement);
      buttonOk.click(); // Click Ok button
      fixture.detectChanges();
      expect(isButtonLoading(buttonOk)).not.toBeFalsy();

      tick(3000 + 10);
      fixture.detectChanges();
      flush();
      fixture.detectChanges(); // In order to trigger ModalInstance's UI updating after finished hiding
      expectModalHidden(modalElement, true);
    }));
  }); // /async

  describe('demo-confirm-promise', () => {
    const tempModalId = generateUniqueId(); // Temp unique id to mark the confirm modal that created by service
    let modalAgent: ModalPublicAgent;
    let buttonShow: HTMLButtonElement;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [ NzButtonModule, NzModalModule ],
        declarations: [ NzDemoModalConfirmPromiseComponent ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(NzDemoModalConfirmPromiseComponent);
      instance = fixture.debugElement.componentInstance;
      buttonShow = fixture.debugElement.query(By.directive(NzButtonComponent)).nativeElement;

      buttonShow.click();
      fixture.detectChanges();
      modalAgent = instance.confirmModal;
      modalAgent.getElement().classList.add(tempModalId);
    });

    it('should open and click Ok to destroy after 1000ms', fakeAsync(() => {
      expectModalDestroyed(tempModalId, false);

      getButtonOk(modalAgent.getElement()).click(); // Click Ok button
      fixture.detectChanges();
      tick(1000 + 10);
      fixture.detectChanges();
      flush();
      fixture.detectChanges();
      expectModalDestroyed(tempModalId, true);
    }));

    it('should open and destroy immediately when click Cancel', fakeAsync(() => {
      expectModalDestroyed(tempModalId, false);

      getButtonClose(modalAgent.getElement()).click(); // Click Close button
      fixture.detectChanges();
      flush();
      fixture.detectChanges();
      expectModalDestroyed(tempModalId, true);
    }));
  }); // /confirm-promise

  describe('NormalModal: created by service with most APIs', () => {
    const tempModalId = generateUniqueId(); // Temp unique id to mark the confirm modal that created by service
    let modalAgent: ModalPublicAgent;
    let modalElement: HTMLElement;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [ NzModalModule ],
        declarations: [ TestBasicServiceComponent ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(TestBasicServiceComponent);
      instance = fixture.debugElement.componentInstance;
      modalAgent = instance.basicModal;
      modalElement = modalAgent.getElement();
      modalElement.classList.add(tempModalId); // Mark with id
    });

    it('should correctly render all basic props', fakeAsync(() => {
      const modalInstance = modalAgent.getInstance();
      spyOn(console, 'log');

      // [Hack] Codes that can't be covered by normal operations
      // tslint:disable-next-line:no-any
      expect((modalInstance as any).changeVisibleFromInside(true) instanceof Promise).toBe(true);

      expect((modalElement.querySelector('.ant-modal-wrap') as HTMLElement).style.zIndex).toBe('1888');
      expect((modalElement.querySelector('.ant-modal-wrap') as HTMLElement).classList.contains('test-wrap-class-name')).toBe(true);
      expect((modalElement.querySelector('.ant-modal') as HTMLElement).style.width).toBe('250px');
      expect((modalElement.querySelector('.ant-modal') as HTMLElement).classList.contains('test-class-name')).toBe(true);
      expect((modalElement.querySelector('.ant-modal') as HTMLElement).style.top).toBe('20pt');
      expect((modalElement.querySelector('.ant-modal-title') as HTMLElement).innerHTML.indexOf('<b>TEST BOLD TITLE</b>')).toBeGreaterThan(-1);
      // expect((modalElement.querySelector('.ant-modal-footer') as HTMLElement).innerHTML.indexOf('<div>custom html footer: <i>OK</i></div>')).toBeGreaterThan(-1);
      expect((modalElement.querySelector('.ant-modal-body') as HTMLElement).innerHTML.indexOf('<p>test html content</p>')).toBeGreaterThan(-1);
      expect((modalElement.querySelector('.ant-modal-body') as HTMLElement).style.background).toBe('gray');
      expect(getButtonOk(modalElement).innerHTML.indexOf('custom ok')).toBeGreaterThan(-1);
      expect(getButtonOk(modalElement).classList.contains('ant-btn-success')).toBe(true);
      expect(isButtonLoading(getButtonOk(modalElement))).toBeFalsy();
      expect(getButtonCancel(modalElement).innerHTML.indexOf('custom cancel')).toBeGreaterThan(-1);
      expect(isButtonLoading(getButtonCancel(modalElement))).not.toBeFalsy();
      expect(modalElement.querySelector('.ant-modal-close')).toBeFalsy();
      expect(modalElement.querySelector('.ant-modal-mask')).toBeFalsy();

      // click ok button
      getButtonOk(modalElement).click();
      expect(console.log).toHaveBeenCalledWith('click ok');
      expectModalDestroyed(tempModalId, false); // shouldn't destroy when ok button returns false
      // change and click mask
      modalInstance.nzMask = true;
      fixture.detectChanges();
      // should show mask
      expect((modalElement.querySelector('.ant-modal-mask') as HTMLElement).style.opacity).toBe('0.4');
      // should not trigger nzOnCancel if click mask
      (modalElement.querySelector('.ant-modal-wrap') as HTMLElement).click();
      expect(console.log).not.toHaveBeenCalledWith('click cancel');
      // change nzMaskClosable to true then click, should be called and destroyed
      modalInstance.nzMaskClosable = true;
      (modalElement.querySelector('.ant-modal-wrap') as HTMLElement).click();
      expect(console.log).toHaveBeenCalledWith('click cancel');
      flush();
      expectModalDestroyed(tempModalId, true); // should be destroyed
    })); // /basic props
  });

  describe('NormalModal: created by service with vary nzContent and nzFooter', () => {
    const tempModalId = generateUniqueId(); // Temp unique id to mark the confirm modal that created by service
    let modalAgent: ModalPublicAgent;
    let modalElement: HTMLElement;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [ NzModalModule ],
        declarations: [ TestVaryServiceComponent, TestVaryServiceCustomComponent ]
      });
      TestBed.overrideModule(BrowserDynamicTestingModule, {
        set: { entryComponents: [ TestVaryServiceCustomComponent ] }
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(TestVaryServiceComponent);
      instance = fixture.debugElement.componentInstance;
      modalAgent = instance.createWithVary();
      modalElement = modalAgent.getElement();
      modalElement.classList.add(tempModalId); // Mark with id
    });

    it('should change title from in/outside and trigger button', fakeAsync(() => {
      fixture.detectChanges(); // Initial change detecting

      const contentComponent = modalAgent.getContentComponentRef().instance as TestVaryServiceCustomComponent;
      const contentElement = contentComponent.elementRef.nativeElement as HTMLElement;
      // change title from outside
      const firstButton = modalElement.querySelector('.ant-modal-footer button:first-child') as HTMLButtonElement;
      firstButton.click();
      fixture.detectChanges();
      expect(contentComponent.title).toBe('internal title changed');
      expect(isButtonLoading(firstButton)).toBe(false); // stopped immediately

      // button loading for Promise
      const lastButton = modalElement.querySelector('.ant-modal-footer button:last-child') as HTMLButtonElement;
      lastButton.click();
      fixture.detectChanges();
      expect(isButtonLoading(lastButton)).toBe(false); // stopped immediately

      // destroy from inside
      contentElement.querySelector('button').click();
      fixture.detectChanges();
      flush();
      expectModalDestroyed(tempModalId, true);
    })); // /vary with component
  });

  describe('ConfirmModal: should apply options correctly', () => {
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [ NzModalModule ],
        declarations: [ TestConfirmModalComponent ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(TestConfirmModalComponent);
      instance = fixture.debugElement.componentInstance;
    });

    it('boundary detection for options', fakeAsync(() => {
      const logger = instance.modalService.logger;
      spyOn(logger, 'warn');

      const tempModalId = generateUniqueId();
      const modalAgent = instance.createConfirm() as ModalPublicAgent;
      const modalElement = modalAgent.getElement();
      modalElement.classList.add(tempModalId);
      fixture.detectChanges();
      // nzFooter
      expect(logger.warn).toHaveBeenCalled();
      // nzOnOk: close modal when clicked
      getButtonOk(modalElement).click();
      fixture.detectChanges();
      flush();
      fixture.detectChanges();
      expectModalDestroyed(tempModalId, true);
    }));

    it('should render other confirm modals', fakeAsync(() => {
      const ids: string[] = instance.createOtherModals();
      fixture.detectChanges();
      flush();
      fixture.detectChanges();
      ids.forEach(id => expectModalDestroyed(id, false));
    }));
  });

  describe('css-unit.pipe', () => {
    let testElement: HTMLDivElement;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [ CssUnitPipe, TestCssUnitPipeComponent ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(TestCssUnitPipeComponent);
      testElement = fixture.debugElement.query(By.css('div')).nativeElement;
      fixture.detectChanges();
    });

    it('should "width" & "height" to be 100px', () => {
      // fixture.detectChanges();
      expect(testElement.style.width).toBe('100px');
      expect(testElement.style.height).toBe('100px');
    });

    it('should "top" to be 100pt', () => {
      // fixture.detectChanges();
      expect(testElement.style.top).toBe('100pt');
    });
  });
});

// -------------------------------------------
// | Testing Components
// -------------------------------------------

@Component({
  selector: 'nz-demo-modal-async',
  template: `
    <button nz-button nzType="primary" (click)="showModal()">
      <span>show modal</span>
    </button>
    <nz-modal [(nzVisible)]="isVisible" nzTitle="title" (nzOnCancel)="handleCancel($event)" (nzOnOk)="handleOk($event)" [nzOkLoading]="isOkLoading">
      <p>content</p>
    </nz-modal>
  `,
  styles: []
})
class NzDemoModalAsyncComponent {
  isVisible = false;
  isOkLoading = false;

  showModal(): void {
    this.isVisible = true;
  }

  handleOk($event: MouseEvent): void {
    this.isOkLoading = true;
    window.setTimeout(() => {
      this.isVisible = false;
      this.isOkLoading = false;
    }, 3000);
  }

  handleCancel($event: MouseEvent): void {
    this.isVisible = false;
  }
}

@Component({
  selector: 'nz-demo-modal-confirm-promise',
  template: `
    <button nz-button nzType="info" (click)="showConfirm()">Confirm</button>
  `,
  styles  : []
})
class NzDemoModalConfirmPromiseComponent {
  confirmModal: ModalPublicAgent; // For testing by now

  constructor(private modal: NzModalService) { }

  showConfirm(): void {
    this.confirmModal = this.modal.confirm({
      nzTitle: 'Do you Want to delete these items?',
      nzContent: 'When clicked the OK button, this dialog will be closed after 1 second',
      nzOnOk: () => new Promise((resolve, reject) => {
        setTimeout(Math.random() > 0.5 ? resolve : reject, 1000);
      }).catch(() => console.log('Oops errors!'))
    });
  }
}

@Component({
  template: ``
})
class TestBasicServiceComponent {
  basicModal: ModalPublicAgent;

  constructor(private modalService: NzModalService) {
    this.modalService.create(); // [Testing Required] Only for coverage temporarily

    // Testing for creating modal immediately
    this.basicModal = this.modalService.create({
      nzGetContainer: () => document.body,
      nzZIndex: 1888,
      nzWidth: 250,
      nzWrapClassName: 'test-wrap-class-name',
      nzClassName: 'test-class-name',
      nzStyle: { left: '10px', top: '20pt', border: '2px solid red' },
      nzTitle: '<b>TEST BOLD TITLE</b>',
      nzContent: '<p>test html content</p>',
      nzClosable: false,
      nzMask: false,
      nzMaskClosable: false,
      nzMaskStyle: { opacity: 0.4 },
      nzBodyStyle: { background: 'gray' },
      // nzFooter: '<div>custom html footer: <i>OK</i></div>',
      nzOkText: 'custom ok',
      nzOkType: 'success',
      nzOkLoading: false,
      nzOnOk: () => { console.log('click ok'); return false; },
      nzCancelText: 'custom cancel',
      nzCancelLoading: true,
      nzOnCancel: () => console.log('click cancel')
    });
  }
}

@Component({
  template: ``
})
class TestVaryServiceComponent {
  constructor(private modalService: NzModalService) {}

  createWithVary(): ModalPublicAgent {
    const modal = this.modalService.create({
      nzContent: TestVaryServiceCustomComponent,
      nzComponentParams: { title: 'internal title', subtitle: 'subtitle' },
      nzFooter: [
        {
          label: 'change title from outside',
          onClick: (componentInstance: TestVaryServiceCustomComponent) => {
            componentInstance.title = 'internal title changed';
            return Promise.resolve();
          }
        },
        {
          label: 'show loading',
          onClick: () => Promise.reject(null)
        }
      ]
    });

    return modal;
  }
}
@Component({
  template: `
    <h2>{{ title }}</h2><h4>{{ subtitle }}</h4>
    <button (click)="destroyModal()">destroy</button>
  `
})
export class TestVaryServiceCustomComponent {
  @Input() title: string;
  @Input() subtitle: string;

  constructor(private modal: ModalPublicAgent, public elementRef: ElementRef) { }

  destroyModal(): void {
    this.modal.destroy();
  }
}

@Component({
  template: ``
})
export class TestConfirmModalComponent {
  constructor(public modalService: NzModalService) { }

  createConfirm(): ModalPublicAgent {
    this.modalService.confirm(); // [Testing Required] Only for coverage temporarily
    this.modalService.confirm({ nzWidth: 100 }); // [Testing Required] Only for coverage temporarily

    // Boundary detection for options: nzFooter, nzOnOk
    return this.modalService.confirm({
      nzFooter: 'should warning',
      nzOkText: 'close'
    });
  }

  createOtherModals(): string[] {
    return [ 'info', 'success', 'error', 'warning' ].map(type => {
      const modalId = generateUniqueId();
      this.modalService[type]({ nzClassName: modalId });
      this.modalService[type]();  // [Testing Required] Only for coverage temporarily
      return modalId;
    });
  }
}

@Component({
  template: `<div [style.width]="100 | toCssUnit" [style.height]="'100px' | toCssUnit" [style.top]="100 | toCssUnit:'pt'"></div>`
})
class TestCssUnitPipeComponent { }

// -------------------------------------------
// | Local tool functions
// -------------------------------------------

function expectModalHidden(modalElement: HTMLElement, hidden: boolean): void {
  const display = (modalElement.querySelector('.ant-modal-wrap') as HTMLElement).style.display;
  if (hidden) {
    expect(display).toBe('none');
  } else {
    expect(display).not.toBe('none');
  }
  expect(modalElement.querySelector('.ant-modal-mask').classList.contains('ant-modal-mask-hidden')).toBe(hidden);
}

function expectModalDestroyed(classId: string, destroyed: boolean): void {
  const element = document.querySelector(`.${classId}`);
  if (destroyed) {
    expect(element).toBeFalsy();
  } else {
    expect(element).not.toBeFalsy();
  }
}

let counter = 0;
function generateUniqueId(): string {
  return `testing-uniqueid-${counter++}`;
}

function getButtonOk(modalElement: HTMLElement): HTMLButtonElement {
  return isConfirmModal(modalElement) ? modalElement.querySelector('.ant-confirm-btns button:last-child') as HTMLButtonElement : modalElement.querySelector('.ant-modal-footer button:last-child') as HTMLButtonElement;
}

function getButtonCancel(modalElement: HTMLElement): HTMLButtonElement {
  return isConfirmModal(modalElement) ? modalElement.querySelector('.ant-confirm-btns button:first-child') as HTMLButtonElement : modalElement.querySelector('.ant-modal-footer button:first-child') as HTMLButtonElement;
}

function getButtonClose(modalElement: HTMLElement): HTMLButtonElement { // For normal modal only
  return modalElement.querySelector('.ant-modal-close') as HTMLButtonElement;
}

function isConfirmModal(modalElement: HTMLElement): boolean {
  return !!modalElement.querySelector('.ant-confirm');
}

function isButtonLoading(buttonElement: HTMLButtonElement): boolean {
  return !!buttonElement.querySelector('i.anticon-loading');
}
