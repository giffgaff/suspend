import Modal from "flarum/components/Modal";
import Button from "flarum/components/Button";

import Stream from "flarum/utils/Stream";
import withAttr from "flarum/utils/withAttr";
import ItemList from "flarum/utils/ItemList";

export default class SuspendUserModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

    let until = this.attrs.user.suspendedUntil();
    let reason = this.attrs.user.suspendReason();
    let reasonRaw = this.attrs.user.suspendReasonRaw();
    let message = this.attrs.user.suspendMessage();
    let messageRaw = this.attrs.user.suspendMessageRaw();
    let status = null;

    if (new Date() > until) until = null;

    if (until) {
      if (until.getFullYear() === 9999) status = "indefinitely";
      else status = "limited";
    }

    this.status = Stream(status);
    this.reason = Stream(reason);
    this.reasonRaw = Stream(reasonRaw);
    this.message = Stream(message);
    this.messageRaw = Stream(messageRaw);
    this.daysRemaining = Stream(
      status === "limited" && -dayjs().diff(until, "days") + 1
    );

    this.editingReason = reason ? false : true;
    this.editingMessage = message ? false : true;
  }

  className() {
    return "SuspendUserModal Modal--medium";
  }

  title() {
    return app.translator.trans("flarum-suspend.forum.suspend_user.title", {
      user: this.attrs.user,
    });
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Form">
          <div className="Form-group">
            <label>
              {app.translator.trans(
                "flarum-suspend.forum.suspend_user.status_heading"
              )}
            </label>
            <div>{this.formItems().toArray()}</div>
          </div>
          <div className="Form-group">
            <Button
              className="Button Button--primary"
              loading={this.loading}
              type="submit"
            >
              {app.translator.trans(
                "flarum-suspend.forum.suspend_user.submit_button"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  formItems() {
    const items = new ItemList();

    items.add(
      "not-suspended",
      <label className="checkbox">
        <input
          type="radio"
          name="status"
          checked={!this.status()}
          value=""
          onclick={withAttr("value", this.status)}
        />
        {app.translator.trans(
          "flarum-suspend.forum.suspend_user.not_suspended_label"
        )}
      </label>,
      100
    );

    items.add(
      "indefinitely",
      <label className="checkbox">
        <input
          type="radio"
          name="status"
          checked={this.status() === "indefinitely"}
          value="indefinitely"
          onclick={withAttr("value", this.status)}
        />
        {app.translator.trans(
          "flarum-suspend.forum.suspend_user.indefinitely_label"
        )}
      </label>,
      90
    );

    items.add(
      "time-suspension",
      <label className="checkbox SuspendUserModal-days">
        <input
          type="radio"
          name="status"
          checked={this.status() === "limited"}
          value="limited"
          onclick={(e) => {
            this.status(e.target.value);
            m.redraw.sync();
            this.$(".SuspendUserModal-days-input input").select();
            e.redraw = false;
          }}
        />
        {app.translator.trans(
          "flarum-suspend.forum.suspend_user.limited_time_label"
        )}
        {this.status() === "limited" ? (
          <div className="SuspendUserModal-days-input">
            <input
              type="number"
              min="0"
              value={this.daysRemaining()}
              oninput={withAttr("value", this.daysRemaining)}
              className="FormControl"
            />
            {app.translator.trans(
              "flarum-suspend.forum.suspend_user.limited_time_days_text"
            )}
          </div>
        ) : (
          ""
        )}
      </label>,
      80
    );

    const reasonContent = this.editingReason ? (
      <textarea
        className="FormControl"
        bidi={this.reasonRaw}
        placeholder="optional"
        rows="2"
      />
    ) : (
      <div
        className="Suspend-content"
        onclick={this.editReason.bind(this)}
      >
        {m.trust(this.reason())}
      </div>
    );

    items.add(
      "reason",
      <label>
        {app.translator.trans("flarum-suspend.forum.suspend_user.reason")}
        {reasonContent}
      </label>,
      70
    );

    const messageContent = this.editingMessage ? (
      <textarea
        className="FormControl"
        bidi={this.messageRaw}
        placeholder="optional"
        rows="2"
      />
    ) : (
      <div
        className="Suspend-content"
        onclick={this.editMessage.bind(this)}
      >
        {m.trust(this.message())}
      </div>
    );

    items.add(
      "message",
      <label>
        {app.translator.trans(
          "flarum-suspend.forum.suspend_user.display_message"
        )}
        {messageContent}
      </label>,
      60
    );

    return items;
  }

  onsubmit(e) {
    e.preventDefault();

    this.loading = true;

    let suspendedUntil = null;

    switch (this.status()) {
      case "indefinitely":
        suspendedUntil = new Date("2038-01-01");
        break;

      case "limited":
        suspendedUntil = dayjs().add(this.daysRemaining(), "days").toDate();
        break;

      default:
      // no default
    }

    this.attrs.user
      .save({
        suspendedUntil: suspendedUntil,
        suspendReasonRaw: this.reasonRaw(),
        suspendMessageRaw: this.messageRaw(),
      })
      .then(() => this.hide(), this.loaded.bind(this));
  }

  /**
   * Edit the reason.
   */
  editReason() {
    this.editingReason = true;
    m.redraw();
  }

  /**
   * Edit the display message.
   */
  editMessage() {
    this.editingMessage = true;
    m.redraw();
  }
}
