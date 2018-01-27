/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PartDataComponent } from './part-data.component';

describe('PartDataComponent', () => {
  let component: PartDataComponent;
  let fixture: ComponentFixture<PartDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PartDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
