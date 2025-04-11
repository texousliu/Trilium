# Displaying the option in settings
Go to `src/public/app/widgets/type_widgets/options` and select a corresponding category, such as `appearance` and edit one of the JS files.

For example, to create a select:

First, modify the template (`TPL`), to add the new widget:

```plain
<div class="col-6">
    <label>First day of the week</label>
    <select class="first-day-of-week-select form-control">
        <option value="0">Sunday</option>
        <option value="1">Monday</option>
    </select>
</div>
```

Secondly, create a reference to the new element in `doRender()`:

```plain
this.$firstDayOfWeek = this.$widget.find(".first-day-of-week-select");
```

Then in `optionsLoaded` adjust the value to the one set in the database:

```plain
this.$firstDayOfWeek.val(options.firstDayOfWeek);
```

To actually update the option, add a listener in `doRender`:

```plain
this.$firstDayOfWeek.on("change", () => {
    this.updateOption("firstDayOfWeek", this.$firstDayOfWeek.val());
});
```