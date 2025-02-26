'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import EditableContent from './editable/content';
import Input from './form/input';
import TextAreaInput from './form/text-area';
import SelectInput from './form/select';
import { noop } from '../utils';
import { pick } from '../common/immutable';

class Editable extends React.PureComponent {
	get isActive() {
		return (this.props.isActive || this.props.isBusy) && !this.props.isDisabled;
	}

	get isReadOnly() {
		return this.props.isReadOnly || this.props.isBusy;
	}

	get className() {
		// input type auto-detection doesn't work if element is nested (which it can be, see
		// BoxFieldInput). This causes #440. TODO: drop auto-detection and always use explicit prop
		// to define textarea/select editables
		const { input, inputComponent, isSelect, isTextArea } = this.props;
		return {
			'editable': true,
			'editing': this.isActive,
			'textarea': inputComponent === TextAreaInput || (input && input.type === TextAreaInput) || isTextArea,
			'select': inputComponent === SelectInput || (input && input.type === SelectInput) || isSelect,
		};
	}

	renderContent() {
		const hasChildren = typeof this.props.children !== 'undefined';
		return (
			<React.Fragment>
				{
				hasChildren ?
					this.props.children :
					<EditableContent { ...this.props } />
				}
			</React.Fragment>
		);
	}

	renderControls() {
		const { input: InputElement, inputComponent: InputComponent } = this.props;
		if(InputElement) {
			return InputElement;
		} else {
			const { className, ...props } = this.props;
			return <InputComponent
				className={ cx(className, "editable-control") }
				{ ...props }
			/>
		}
	}

	render() {
		const { isDisabled, tabIndex, ...rest } = this.props;
		return (
			<div
				tabIndex={ isDisabled ? null : this.isActive ? null : tabIndex }
				onClick={ event => this.props.onClick(event) }
				onFocus={ event => this.props.onFocus(event) }
				className={ cx(this.className, { 'disabled': isDisabled }) }
				{ ...pick(rest, p => p.startsWith('data-')) }
			>
				{ this.isActive ? this.renderControls() : this.renderContent() }
			</div>
		);
	}
	static defaultProps = {
		inputComponent: Input,
		onClick: noop,
		onFocus: noop,
		tabIndex: 0,
	};

	static propTypes = {
		children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]),
		input: PropTypes.element,
		inputComponent: PropTypes.elementType,
		isActive: PropTypes.bool,
		isBusy: PropTypes.bool,
		isDisabled: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		isSelect: PropTypes.bool,
		isTextArea: PropTypes.bool,
		tabIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	};
}


export default Editable;
